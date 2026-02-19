import type { IBindings } from 'fetch-sparql-endpoint'
import { Algebra, algebraUtils } from '@traqula/algebra-transformations-1-1'
import { LRUCache } from 'lru-cache'
import {
  type QueryBuffer,
  queryIdentifierVariable,
  bindingsToValues,
  algebraFactory,
  queryBindings,
  executeBatched,
  queryCacheMaxEntries,
  queryCacheMaxAgeMilliseconds,
  generateQueryIdentifier,
  serialiseQuery,
  queryCount,
  invocationCount
} from './query'

const queryCache = new LRUCache<string, IBindings[]>({ max: queryCacheMaxEntries, ttl: queryCacheMaxAgeMilliseconds })
const queryBuffer: QueryBuffer<IBindings[]> = {}

async function execute(batchIdentifier: string): Promise<void> {
  const batch = queryBuffer[batchIdentifier]!
  delete queryBuffer[batchIdentifier]
  console.log('SELECT:', batch)

  const query = <Algebra.Operation>algebraUtils.mapOperation(batch.query, {
    [Algebra.Types.PROJECT]: {
      preVisitor: () => ({ continue: false }),
      transform: (_, op) => algebraFactory.createProject(
        algebraFactory.createJoin([ bindingsToValues(batch.bindings), op.input ]),
        [ ...op.variables, queryIdentifierVariable ]
      )
    }
  })

  try {
    queryCount.value++

    const queryString = serialiseQuery(query)
    const bindingsArray = await queryBindings(batch.endpoint, queryString)
    const bindingsByQuery: Record<string, IBindings[]> = {}

    for (const bindings of bindingsArray) {
      const queryIdentifier = bindings[queryIdentifierVariable.value]!.value
      if (bindingsByQuery[queryIdentifier]) {
        bindingsByQuery[queryIdentifier].push(bindings)
      } else {
        bindingsByQuery[queryIdentifier] = [ bindings ]
      }
    }

    // Forward bindings to their respective resolution functions
    for (const [ identifier, bindings ] of Object.entries(bindingsByQuery)) {
      queryCache.set(identifier, bindings)
      for (const resolution of batch.resolutions[identifier]!) {
        resolution(bindings)
      }
      delete batch.resolutions[identifier]
    }

    // Mark all remaining queries without bindings as finished
    for (const [ identifier, resolutions ] of Object.entries(batch.resolutions)) {
      queryCache.set(identifier, [])
      for (const resolution of resolutions) {
        resolution([])
      }
    }
  } catch (error: unknown) {
    // Send the error to all queries
    for (const rejections of Object.values(batch.rejections)) {
      for (const rejection of rejections) {
        rejection(error)
      }
    }
    // Raise the error so it gets propagated
    throw error
  }
}

async function select(endpoint: string, query: string, bindings: IBindings[]): Promise<IBindings[]> {
  invocationCount.value++
  const queryIdentifier = generateQueryIdentifier(endpoint, query, bindings)
  const cachedBindings = queryCache.get(queryIdentifier)
  return cachedBindings ? Promise.resolve(cachedBindings) : executeBatched<IBindings[]>(endpoint, query, bindings, queryBuffer, execute)
}

export { select }
