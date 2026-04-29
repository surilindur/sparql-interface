import type * as RDF from '@rdfjs/types'
import { ref } from 'vue'
import { QueryEngine } from '@comunica/query-sparql'
import { BindingsFactory } from '@comunica/utils-bindings-factory'
import { AlgebraFactory } from '@traqula/algebra-transformations-1-1'
import { algebraUtils, type Algebra } from '@traqula/algebra-transformations-1-1'
import { toAlgebra, toAst } from '@traqula/algebra-sparql-1-1'
import { Generator } from '@traqula/generator-sparql-1-1'
import { Parser } from '@traqula/parser-sparql-1-1'
import { DataFactory } from 'rdf-data-factory'
import MurmurHash3 from 'imurmurhash'
import type { IBindings } from './types'

const dataFactory = new DataFactory()
const bindingsFactory = new BindingsFactory(dataFactory)
const sparqlParser = new Parser()
const sparqlGenerator = new Generator()
const algebraFactory = new AlgebraFactory(dataFactory)
const queryEngine = new QueryEngine()

const queryCount = ref<number>(0)
const invocationCount = ref<number>(0)

const queryCacheMaxEntries = 100_000
const queryCacheMaxAgeMilliseconds = 1_000 * 60 * 10
const batchWindowMilliseconds = 500
const queryIdentifierVariable = dataFactory.variable('query')

type QueryBatch<T> = {
  query: Algebra.Operation,
  source: string,
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
 * Generate a query batch identifier, to allow grouping together identical queries to a single source.
 */
function generateBatchIdentifier(source: string, query: string, bindings: IBindings[]): string {
  const value = JSON.stringify({
    source,
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
function generateQueryIdentifier(source: string, query: string, bindings: IBindings[]): string {
  const value = JSON.stringify({
    source,
    query,
    // Ensure the binding objects always sorted identically
    bindings: Object.fromEntries(Object.entries(bindings).sort((a, b) => a[0] < b[0] ? -1 : 1))
  })
  const hash = MurmurHash3(value).result().toString(16)
  return `urn:query:${hash}`
}

/**
 * Helper function to create a VALUES clause out of bindings.
 */
function bindingsToValues(bindings: IBindings[]): Algebra.Values | Algebra.Nop {
  if (bindings.length > 0) {
    return algebraFactory.createValues(
      Object.keys(bindings[0]!).map(k => dataFactory.variable(k)),
      <Record<string, RDF.Literal | RDF.NamedNode>[]>bindings
    )
  }
  return algebraFactory.createNop()
}

/**
 * Helper function to push executions into buffers based on identifiers.
 */
async function executeBatched<T>(
  source: string,
  query: string,
  bindings: IBindings[],
  buffer: QueryBuffer<T>,
  executor: (batch: string) => Promise<void>
): Promise<T> {
  const batchIdentifier = generateBatchIdentifier(source, query, bindings)
  const queryIdentifier = generateQueryIdentifier(source, query, bindings)
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
        source,
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
    bindingsFactory,
    queryEngine,
    batchWindowMilliseconds,
    queryCount,
    invocationCount,
    queryIdentifierVariable,
    queryCacheMaxEntries,
    queryCacheMaxAgeMilliseconds,
    type QueryBuffer,
    parseQuery,
    serialiseQuery,
    bindingsToValues,
    executeBatched,
    getInScopeVariables,
    generateBatchIdentifier,
    generateQueryIdentifier
}
