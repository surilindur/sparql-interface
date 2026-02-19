import type * as RDF from '@rdfjs/types'
import { AlgebraFactory } from '@traqula/algebra-transformations-1-1'
import { algebraUtils, type Algebra } from '@traqula/algebra-transformations-1-1'
import { toAlgebra, toAst } from '@traqula/algebra-sparql-1-1'
import { Generator } from '@traqula/generator-sparql-1-1'
import { Parser } from '@traqula/parser-sparql-1-1'

// import { Algebra, Factory, translate, Util } from 'sparqlalgebrajs'

import { type IBindings, SparqlEndpointFetcher } from 'fetch-sparql-endpoint'
import { DataFactory } from 'rdf-data-factory'
import MurmurHash3 from 'imurmurhash'
import type { IQuery } from '../types/query'
import { extractQueryExamples } from '../defaults/queries'
import { ref } from 'vue'

const dataFactory = new DataFactory()
const sparqlParser = new Parser()
const sparqlGenerator = new Generator()
const algebraFactory = new AlgebraFactory(dataFactory)
//const algebraFactory = new Factory(dataFactory)
const endpointFetcher = new SparqlEndpointFetcher({ dataFactory })

const queryCount = ref<number>(0)
const invocationCount = ref<number>(0)

const queryCacheMaxEntries = 100_000
const queryCacheMaxAgeMilliseconds = 1_000 * 60 * 10
const batchWindowMilliseconds = 500
const queryIdentifierVariable = dataFactory.variable('query')

type QueryBatch<T> = {
  query: Algebra.Operation,
  endpoint: string,
  bindings: IBindings[],
  resolutions: Record<string, ((value: T) => void)[]>,
  rejections: Record<string, ((error: unknown) => void)[]>,
}

type QueryBuffer<T> = Record<string, QueryBatch<T>>

/**
 * Convert a query string into an algebra operation.
 */
function parseQuery(query: string): Algebra.Operation {
  const ast = sparqlParser.parse(query)
  const operation = toAlgebra(ast)
  return operation
}

/**
 * Convert an algebra operation into the string representation.
 */
function serialiseQuery(query: Algebra.Operation): string {
  const ast = toAst(query)
  const serialisation = sparqlGenerator.generate(ast)
  return serialisation
}

/**
 * Collect the projected variables.
 */
function getInScopeVariables(query: string): RDF.Variable[] {
  const operation = parseQuery(query)
  const variables = algebraUtils.inScopeVariables(operation)
  return variables
}

/**
 * Helper function to extract comments from a query.
 */
function splitCommentFromQuery(query: string): IQuery {
  const commentLines: string[] = []
  const queryLines: string[] = []
  for (const line of query.split('\n')) {
    if (line.startsWith('#') && queryLines.length === 0) {
      commentLines.push(line.replace(/^# +?/, ''))
    } else {
      queryLines.push(line)
    }
  }
  return {
    comment: commentLines.join('\n').trim(),
    content: queryLines.join('\n').trim()
  }
}

/**
 * Generate a query batch identifier, to allow grouping together identical queries to a single endpoint.
 */
function generateBatchIdentifier(endpoint: string, query: string, bindings: IBindings[]): string {
  const value = JSON.stringify({
    endpoint,
    query,
    // Only considers the keys, because different values could exist for the variables
    bound: Object.keys(bindings).sort()
  })
  const hash = MurmurHash3(value).result().toString(16)
  return `urn:batch:${hash}`
}

/**
 * Generate a query identifier that takes into account also the binding values.
 */
function generateQueryIdentifier(endpoint: string, query: string, bindings: IBindings[]): string {
  const value = JSON.stringify({
    endpoint,
    query,
    // Ensure the binding objects always sorted identically
    bindings: Object.fromEntries(Object.entries(bindings).sort((a, b) => a[0] < b[0] ? -1 : 1))
  })
  const hash = MurmurHash3(value).result().toString(16)
  return `urn:query:${hash}`
}

/**
 * Helper function to fetch all bindings as an array for the given query.
 */
function queryBindings(endpoint: string, query: string): Promise<IBindings[]> {
  return new Promise((resolve, reject) => endpointFetcher.fetchBindings(endpoint, query)
    .then(bindingsStream => {
      const output: IBindings[] = []
      bindingsStream
        .on('data', (bindings: IBindings) => output.push(bindings))
        .on('end', () => resolve(output))
        .on('error', reject)
    }).catch(reject))
}

/**
 * Helper function to collect example queries from a SPARQL endpoint.
 */
async function collectExampleQueriesFromEndpoint(endpoint: string): Promise<IQuery[]> {
  const bindings = await queryBindings(endpoint, extractQueryExamples)
  const queries: IQuery[] = bindings.map(b => ({
    comment: b.comment!.value,
    content: b.content!.value
  }))
  return queries
}

/**
 * Helper function to create a VALUES clause out of bindings.
 */
function bindingsToValues(bindings: IBindings[]): Algebra.Values | Algebra.Nop {
  if (bindings.length > 0) {
    const variables = Object.keys(bindings[0]!).map(k => dataFactory.variable(k))
    /*
    const mappings: Record<string, RDF.NamedNode | RDF.Literal>[] = []
    for (const mapping of bindings) {
      const output: Record<string, RDF.NamedNode | RDF.Literal> = {}
      for (const [ key, value ] of Object.entries(mapping)) {
        output[`?${key}`] = <RDF.NamedNode | RDF.Literal> value
      }
      mappings.push(output)
    }*/
    return algebraFactory.createValues(variables, <Record<string, RDF.Literal | RDF.NamedNode>[]>bindings)
  }
  return algebraFactory.createNop()
}

/**
 * Helper function to push executions into buffers based on identifiers.
 * @param endpoint The SPARQL endpoint to query.
 * @param query The query string.
 * @param bindings The bindings to use for the query.
 * @param buffer Query buffer to push into.
 * @param executor The function to call when executing queries from buffer.
 * @returns Promise that resolves with the individual results for this query.
 */
async function executeBatched<T>(
  endpoint: string,
  query: string,
  bindings: IBindings[],
  buffer: QueryBuffer<T>,
  executor: (batch: string) => Promise<void>
): Promise<T> {
  const batchIdentifier = generateBatchIdentifier(endpoint, query, bindings)
  const queryIdentifier = generateQueryIdentifier(endpoint, query, bindings)
  const queryIdentifierNode = dataFactory.namedNode(queryIdentifier)

  // Add the current query identifier to the bindings
  bindings = bindings.map(b => ({ ...b, [queryIdentifierVariable.value]: queryIdentifierNode }))

  return new Promise<T>((resolve, reject) => {
    if (buffer[batchIdentifier]) {
      if (buffer[batchIdentifier].resolutions[queryIdentifier]) {
        buffer[batchIdentifier].resolutions[queryIdentifier].push(resolve)
        buffer[batchIdentifier].rejections[queryIdentifier]!.push(reject)
      } else {
        buffer[batchIdentifier].bindings.push(...bindings)
        buffer[batchIdentifier].resolutions[queryIdentifier] = [ resolve ]
        buffer[batchIdentifier].rejections[queryIdentifier] = [ reject ]
      }
    } else {
      buffer[batchIdentifier] = {
        query: parseQuery(query),
        endpoint,
        bindings,
        resolutions: { [queryIdentifier]: [ resolve ] },
        rejections: { [queryIdentifier]: [ reject ] }
      }
      setTimeout(() => executor(batchIdentifier), batchWindowMilliseconds)
    }
  })
}

export {
    dataFactory,
    algebraFactory,
    endpointFetcher,
    batchWindowMilliseconds,
    queryCount,
    invocationCount,
    queryIdentifierVariable,
    queryCacheMaxEntries,
    queryCacheMaxAgeMilliseconds,
    type QueryBuffer,
    parseQuery,
    serialiseQuery,
    queryBindings,
    bindingsToValues,
    executeBatched,
    getInScopeVariables,
    generateBatchIdentifier,
    generateQueryIdentifier,
    splitCommentFromQuery,
    collectExampleQueriesFromEndpoint
}
