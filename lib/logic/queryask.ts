import type { IBindings } from 'fetch-sparql-endpoint'
import { Algebra, algebraUtils } from '@traqula/algebra-transformations-1-1'
import { LRUCache } from 'lru-cache'
import {
  type QueryBuffer,
  algebraFactory,
  bindingsToValues,
  queryBindings,
  executeBatched,
  queryCacheMaxEntries,
  queryCacheMaxAgeMilliseconds,
  queryIdentifierVariable,
  generateQueryIdentifier,
  serialiseQuery,
  queryCount,
  invocationCount
} from './query'

const queryCache = new LRUCache<string, boolean>({ max: queryCacheMaxEntries, ttl: queryCacheMaxAgeMilliseconds })
const queryBuffer: QueryBuffer<boolean> = {}

async function execute(batchIdentifier: string): Promise<void> {
  const batch = queryBuffer[batchIdentifier]!
  delete queryBuffer[batchIdentifier]
  console.log('ASK:', batch)

  const query = <Algebra.Operation>algebraUtils.mapOperation(batch.query, {
    [Algebra.Types.ASK]: {
      preVisitor: () => ({ continue: false }),
      transform: (_, op) => algebraFactory.createProject(
        algebraFactory.createFilter(
          bindingsToValues(batch.bindings),
          algebraFactory.createExistenceExpression(false, op.input)
        ),
        [ queryIdentifierVariable ]
      )
    }
  })

  try {
    queryCount.value++

    const bindingsArray = await queryBindings(batch.endpoint, serialiseQuery(query))

    // Report existence to their corresponding queries
    for (const bindings of bindingsArray) {
      const queryIdentifier = bindings[queryIdentifierVariable.value]!.value
      queryCache.set(queryIdentifier, true)
      for (const resolution of batch.resolutions[queryIdentifier]!) {
        resolution(true)
      }
      delete batch.resolutions[queryIdentifier]
    }

    // Report non-existence to all other queries
    for (const [ identifier, resolutions ] of Object.entries(batch.resolutions)) {
      queryCache.set(identifier, false)
      for (const resolution of resolutions) {
        resolution(false)
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

async function ask(endpoint: string, query: string, bindings: IBindings[]): Promise<boolean> {
  invocationCount.value++
  const queryIdentifier = generateQueryIdentifier(endpoint, query, bindings)
  const cachedBoolean = queryCache.get(queryIdentifier)
  return cachedBoolean ? Promise.resolve(cachedBoolean) : executeBatched<boolean>(endpoint, query, bindings, queryBuffer, execute)
}

export { ask }
