import * as RDF from '@rdfjs/types';
import { Algebra, AlgebraFactory, algebraUtils } from '@traqula/algebra-transformations-1-1';
import type { IBatchedRequest, IBatchedResult, PromiseRejection, PromiseResolution, QueryBatch, QueryBuffer } from './QueryRunnerTypes';
import { toAlgebra, toAst } from '@traqula/algebra-sparql-1-1';
import { DataFactory } from 'rdf-data-factory';
import { Generator } from '@traqula/generator-sparql-1-1';
import type { IBindings } from 'fetch-sparql-endpoint';
import { LRUCache } from 'lru-cache';
import { Parser } from '@traqula/parser-sparql-1-1';
import murmurHash3 from 'imurmurhash';

/**
 * Helper class for running SPARQL queries against a remote endpoint in a worker thread,
 * with batching of queries that share bindings, and an optional result cache.
 */
class QueryRunner {
  private worker: Worker | undefined;

  private readonly batchInterval: number;

  private static readonly queryIdentifierVariableValue = 'query';
  private static readonly dataFactory = new DataFactory();
  private static readonly sparqlParser = new Parser();
  private static readonly sparqlGenerator = new Generator();
  private static readonly algebraFactory = new AlgebraFactory();
  private static readonly textEncoder = new TextEncoder();
  private static readonly textDecoder = new TextDecoder();

  // Results from finished queries for reuse
  private readonly askCache: LRUCache<string, Promise<boolean>> | undefined;
  private readonly selectCache: LRUCache<string, Promise<IBindings[]>> | undefined;

  // Accumulated queries in need of execution
  private readonly askBuffer: QueryBuffer<boolean>;
  private readonly selectBuffer: QueryBuffer<IBindings[]>;

  // Callbacks for pending queries currently being executed
  private readonly askResolutions: Record<string, PromiseResolution<boolean>>;
  private readonly selectResolutions: Record<string, PromiseResolution<IBindings[]>>;

  // All rejections
  private readonly allRejections: PromiseRejection[];

  public constructor(args: IQueryRunnerArgs) {
    this.batchInterval = args.batchInterval;
    this.askBuffer = {};
    this.selectBuffer = {};
    this.allRejections = [];
    this.askResolutions = {};
    this.selectResolutions = {};
    if (args.cacheMaxSize && args.cacheMaxAge) {
      this.askCache = new LRUCache<string, Promise<boolean>>({
        max: args.cacheMaxSize,
        ttl: args.cacheMaxAge
      });
      this.selectCache = new LRUCache<string, Promise<IBindings[]>>({
        max: args.cacheMaxSize,
        ttl: args.cacheMaxAge
      });
    }
  }

  /**
   * Report empty bindings to all pending queries in the specified SELECT batch.
   */
  public reportEmptyBindings(batch: string): void {
    for (const [identifier, resolve] of Object.entries(this.selectResolutions)) {
      if (identifier.startsWith(batch)) {
        resolve([]);
        delete this.selectResolutions[identifier];
        delete this.allRejections[identifier];
      }
    }
  }

  /**
   * Report negative result to all pending ASK queries in the specified batch.
   */
  public reportNegativeAskResults(batch: string): void {
    for (const [identifier, resolve] of Object.entries(this.askResolutions)) {
      if (identifier.startsWith(batch)) {
        resolve(false);
        delete this.askResolutions[identifier];
        delete this.allRejections[identifier];
      }
    }
  }

  /**
   * Process an ASK query result.
   */
  public processAskBatchResult(result: IBatchedResult): void {
    for (const bindings of result.bindings) {
      const queryIdentifier = bindings[QueryRunner.queryIdentifierVariableValue].value;
      const callbackIdentifier = `${result.batch}:${queryIdentifier}`;
      this.askResolutions[callbackIdentifier](true);
      delete this.askResolutions[callbackIdentifier];
      delete this.allRejections[callbackIdentifier];
    }
  }

  /**
   * Process a SELECT query result.
   */
  public processSelectBatchResult(result: IBatchedResult): void {
    const queryBindings: Record<string, IBindings[]> = {};
    for (const bindings of result.bindings) {
      const queryIdentifier = bindings[QueryRunner.queryIdentifierVariableValue].value;
      if (queryBindings[queryIdentifier]) {
        queryBindings[queryIdentifier].push(bindings);
      }
      else {
        queryBindings[queryIdentifier] = [bindings];
      }
    }
    for (const [queryIdentifier, bindings] of Object.entries(queryBindings)) {
      const callbackIdentifier = `${result.batch}:${queryIdentifier}`;
      this.selectResolutions[callbackIdentifier](bindings);
      delete this.allRejections[callbackIdentifier];
    }
  }

  /**
   * Send the results back to all listeners.
   */
  public onWorkerMessage(event: MessageEvent<Uint8Array>): void {
    const result: IBatchedResult = JSON.parse(QueryRunner.textDecoder.decode(event.data));
    if (result.type === 'ask') {
      this.processAskBatchResult(result);
      this.reportNegativeAskResults(result.batch);
    }
    else if (result.type === 'select') {
      this.processSelectBatchResult(result);
      this.reportEmptyBindings(result.batch);
    }
    else {
      throw new Error(`Unknown message: ${JSON.stringify(event.data, null, 2)}`);
    }
  }

  /**
   * Reject all query promises when the worker fails.
   */
  public onWorkerError(event: ErrorEvent): void {
    for (const key of [...this.allRejections.keys()]) {
      this.allRejections[key](event.error);
      delete this.allRejections[key];
      delete this.selectResolutions[key];
      delete this.askResolutions[key];
    }
  }

  /**
   * Helper function to create a VALUES clause out of bindings.
   */
  public static bindingsToValues(bindings: IBindings[]): Algebra.Values | Algebra.Nop {
    if (bindings.length) {
      const variables: Record<string, RDF.Variable> = {};
      for (const mapping of bindings) {
        for (const key of Object.keys(mapping)) {
          if (!variables[key]) {
            variables[key] = QueryRunner.dataFactory.variable(key);
          }
        }
      }
      return QueryRunner.algebraFactory.createValues(
        Object.values(variables),
        (bindings as Record<string, RDF.NamedNode | RDF.Literal>[])
      );
    }
    return QueryRunner.algebraFactory.createNop();
  }

  /**
   * Convert a query string into an algebra operation.
   */
  public static parseQuery(query: string): Algebra.Operation {
    const ast = QueryRunner.sparqlParser.parse(query);
    const operation = toAlgebra(ast);
    return operation;
  }

  /**
   * Convert an algebra operation into the string representation.
   */
  public static serialiseQuery(query: Algebra.Operation): string {
    const ast = toAst(query);
    const serialisation = QueryRunner.sparqlGenerator.generate(ast);
    return serialisation;
  }

  /**
   * Collect the projected variables.
   */
  public static getInScopeVariables(query: string): RDF.Variable[] {
    const operation = QueryRunner.parseQuery(query);
    const variables = algebraUtils.inScopeVariables(operation);
    return variables;
  }

  /**
   * Generate a query batch identifier, to allow grouping together identical queries to a single endpoint.
   */
  public static generateBatchIdentifier(endpoint: string, query: string, bindings: IBindings[]): string {
    const value = JSON.stringify({
      // Only considers the keys, because different values could exist for the variables
      bound: Object.keys(bindings).sort((key1, key2) => key1.localeCompare(key2)),
      endpoint,
      query
    });
    const hash = murmurHash3(value).result().toString(16);
    return `urn:batch:${hash}`;
  }

  /**
   * Generate a query identifier that takes into account also the binding values.
   */
  public static generateQueryIdentifier(endpoint: string, query: string, bindings: IBindings[]): string {
    const sortedBindings: IBindings[] = [];
    for (const mapping of bindings) {
      sortedBindings.push(Object.fromEntries(Object.entries(mapping).sort((entry1, entry2) => entry1[0].localeCompare(entry2[0]))));
    }
    sortedBindings.sort((binds1, binds2) => JSON.stringify(binds1).localeCompare(JSON.stringify(binds2)));
    const value = JSON.stringify({
      bindings: sortedBindings,
      endpoint,
      query
    });
    const hash = murmurHash3(value).result().toString(16);
    return `urn:query:${hash}`;
  }

  /**
   * Helper function to extract comments from a query.
   */
  public static splitCommentFromQuery(query: string): { comment: string; content: string } {
    const commentLines: string[] = [];
    const queryLines: string[] = [];
    for (const line of query.split('\n')) {
      if (line.startsWith('#') && !queryLines.length) {
        commentLines.push(line.replace(/^# +?/u, ''));
      }
      else {
        queryLines.push(line);
      }
    }
    return {
      comment: commentLines.join('\n').trim(),
      content: queryLines.join('\n').trim()
    };
  }

  /**
   * Helper function to ensure the worker exists.
   */
  public getWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(new URL('./QueryRunnerWorker.ts', import.meta.url), { type: 'module' });
      this.worker.addEventListener('message', event => this.onWorkerMessage(event));
      this.worker.addEventListener('error', event => this.onWorkerError(event));
    }
    return this.worker;
  }

  /**
   * Helper function to cancel all pending queries
   */
  public cancelPendingQueries(): void {
    if (this.worker) {
      this.worker.terminate();
    }
    this.onWorkerError(new ErrorEvent('Cancelled', { error: new Error('Cancelled') }));
  }

  /**
   * Helper function to collect example queries from a SPARQL endpoint.
   */
  public async collectExampleQueriesFromEndpoint(endpoint: string): Promise<{ comment: string; content: string }[]> {
    const bindings = await this.querySelect(endpoint, `
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      PREFIX sh: <http://www.w3.org/ns/shacl#>

      SELECT DISTINCT ?query ?comment ?content WHERE {
        ?query rdf:type sh:SPARQLExecutable .
        ?query rdfs:comment ?comment .
        ?query sh:select ?content .
      }
    `, []);
    return bindings.map(mapping => ({
      comment: mapping.comment.value,
      content: mapping.content.value
    }));
  }

  /**
   * Helper function to push executions into buffers based on identifiers.
   */

  public executeBatched<T>(
    endpoint: string,
    query: string,
    queryIdentifier: string,
    bindings: IBindings[],
    buffer: QueryBuffer<T>,
    cache: LRUCache<string, Promise<T>> | undefined,
    executor: (batch: string) => void
  ): Promise<T> {
    const batchIdentifier = QueryRunner.generateBatchIdentifier(endpoint, query, bindings);
    const queryIdentifierTerm = QueryRunner.dataFactory.namedNode(queryIdentifier);

    // Add the current query identifier to the bindings
    const batchBindings = bindings.map(mapping => ({
      ...mapping,
      [QueryRunner.queryIdentifierVariableValue]: queryIdentifierTerm
    }));

    const promise = new Promise<T>((resolve, reject) => {
      if (buffer[batchIdentifier]) {
        buffer[batchIdentifier].bindings.push(...batchBindings);
        buffer[batchIdentifier].callbacks[queryIdentifier] = { reject, resolve };
      }
      else {
        buffer[batchIdentifier] = {
          bindings: batchBindings,
          callbacks: { [queryIdentifier]: { reject, resolve } },
          endpoint,
          query: QueryRunner.parseQuery(query)
        };
        setTimeout(() => executor(batchIdentifier), this.batchInterval);
      }
    });

    // Cache the promise, to ensure further requests reuse it
    cache?.set(queryIdentifier, promise);

    return promise;
  }

  public static createQueryFromSelectBatch(batch: QueryBatch<IBindings[]>): string {
    const operation = algebraUtils.mapOperation(batch.query, {
      [Algebra.Types.PROJECT]: {
        preVisitor: () => ({ continue: false }),
        transform: (_copy, projection: Algebra.Project) => this.algebraFactory.createProject(
          this.algebraFactory.createJoin([this.bindingsToValues(batch.bindings), projection.input]),
          [...projection.variables, QueryRunner.dataFactory.variable(QueryRunner.queryIdentifierVariableValue)]
        )
      }
    }) as Algebra.Operation;
    return QueryRunner.serialiseQuery(operation);
  }

  public executeSelectBatch(batchIdentifier: string): void {
    const batch = this.selectBuffer[batchIdentifier];
    delete this.selectBuffer[batchIdentifier];

    for (const [queryIdentifier, callbacks] of Object.entries(batch.callbacks)) {
      const callbackIdentifier = `${batchIdentifier}:${queryIdentifier}`;
      this.selectResolutions[callbackIdentifier] = callbacks.resolve;
      this.allRejections[callbackIdentifier] = callbacks.reject;
    }

    const request: IBatchedRequest = {
      batch: batchIdentifier,
      endpoint: batch.endpoint,
      query: QueryRunner.createQueryFromSelectBatch(batch),
      type: 'select'
    };

    const requestString = JSON.stringify(request);
    const requestBuffer = QueryRunner.textEncoder.encode(requestString);

    this.getWorker().postMessage(requestBuffer, [requestBuffer.buffer]);
  }

  public querySelect(endpoint: string, query: string, bindings: IBindings[]): Promise<IBindings[]> {
    const queryIdentifier = QueryRunner.generateQueryIdentifier(endpoint, query, bindings);
    const cachedPromise = this.selectCache?.get(queryIdentifier);
    if (cachedPromise) {
      return cachedPromise;
    }
    return this.executeBatched<IBindings[]>(
      endpoint,
      query,
      queryIdentifier,
      bindings,
      this.selectBuffer,
      this.selectCache,
      id => this.executeSelectBatch(id)
    );
  }

  public static createQueryFromAskBatch(batch: QueryBatch<boolean>): string {
    const operation = algebraUtils.mapOperation(batch.query, {
      [Algebra.Types.ASK]: {
        preVisitor: () => ({ continue: false }),
        transform: (_copy, op) => QueryRunner.algebraFactory.createProject(
          QueryRunner.algebraFactory.createFilter(
            QueryRunner.bindingsToValues(batch.bindings),
            QueryRunner.algebraFactory.createExistenceExpression(false, op.input)
          ),
          [QueryRunner.dataFactory.variable(QueryRunner.queryIdentifierVariableValue)]
        )
      }
    }) as Algebra.Operation;
    return QueryRunner.serialiseQuery(operation);
  }

  public executeAskBatch(batchIdentifier: string): void {
    const batch = this.askBuffer[batchIdentifier];
    delete this.askBuffer[batchIdentifier];

    for (const [queryIdentifier, callbacks] of Object.entries(batch.callbacks)) {
      const callbackIdentifier = `${batchIdentifier}:${queryIdentifier}`;
      this.askResolutions[callbackIdentifier] = callbacks.resolve;
      this.allRejections[callbackIdentifier] = callbacks.reject;
    }

    const request: IBatchedRequest = {
      batch: batchIdentifier,
      endpoint: batch.endpoint,
      query: QueryRunner.createQueryFromAskBatch(batch),
      type: 'ask'
    };

    const requestString = JSON.stringify(request);
    const requestBuffer = QueryRunner.textEncoder.encode(requestString);

    this.getWorker().postMessage(requestBuffer, [requestBuffer.buffer]);
  }

  public queryAsk(endpoint: string, query: string, bindings: IBindings[]): Promise<boolean> {
    const queryIdentifier = QueryRunner.generateQueryIdentifier(endpoint, query, bindings);
    const cachedPromise = this.askCache?.get(queryIdentifier);
    if (cachedPromise) {
      return cachedPromise;
    }
    return this.executeBatched<boolean>(
      endpoint,
      query,
      queryIdentifier,
      bindings,
      this.askBuffer,
      this.askCache,
      id => this.executeAskBatch(id)
    );
  }
}

interface IQueryRunnerArgs {
  /**
   * The interval over which to perform batching.
   */
  batchInterval: number;
  /**
   * The maximum number of each type of queries to cache.
   */
  cacheMaxSize: number;
  /**
   * The maximum age of the items in the cache in milliseconds.
   */
  cacheMaxAge: number;
}

export { QueryRunner, type IQueryRunnerArgs };
