import type { IBindings } from './types'
import { Algebra, algebraUtils } from '@traqula/algebra-transformations-1-1'
import { LRUCache } from 'lru-cache'
import {
  type QueryBuffer,
  queryIdentifierVariable,
  bindingsToValues,
  algebraFactory,
  executeBatched,
  queryCacheMaxEntries,
  queryCacheMaxAgeMilliseconds,
  generateQueryIdentifier,
  serialiseQuery,
  queryCount,
  invocationCount,
  queryEngine
} from './query'
import { bindingsToRecord } from './utils'

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
    const bindingsStream = await queryEngine.queryBindings(queryString, { sources: [ batch.source ] })
    const bindingsByQuery: Record<string, IBindings[]> = {}

    for await (const bindings of bindingsStream) {
      const queryIdentifier = bindings.get(queryIdentifierVariable)!.value
      const bindingsRecord = bindingsToRecord(bindings)
      if (bindingsByQuery[queryIdentifier]) {
        bindingsByQuery[queryIdentifier].push(bindingsRecord)
      } else {
        bindingsByQuery[queryIdentifier] = [ bindingsRecord ]
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

async function select(source: string, query: string, bindings: IBindings[]): Promise<IBindings[]> {
  invocationCount.value++
  const queryIdentifier = generateQueryIdentifier(source, query, bindings)
  const cachedBindings = queryCache.get(queryIdentifier)
  return cachedBindings ? Promise.resolve(cachedBindings) : executeBatched<IBindings[]>(source, query, bindings, queryBuffer, execute)
}

export { select }
