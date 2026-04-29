import { queryEngine } from './query'
import type { IQuerySource, IQueryExample } from './types'

import examplesQuery from '../queries/examples.rq?raw'

/**
 * The default sources available for autocompletion in the source field.
 */
const defaultSources: IQuerySource[] = [
  {
    description: 'Integrated Database of Small Molecules',
    url: 'https://idsm.elixir-czech.cz/sparql/endpoint/idsm'
  },
  {
    description: 'UniProt',
    url: 'https://sparql.uniprot.org/sparql'
  }
]

/**
 * Collect query examples from a source.
 */
async function collectQueryExamples(source: string): Promise<IQueryExample[]> {
  const examples: IQueryExample[] = []
  const bindingsStream = await queryEngine.queryBindings(examplesQuery, { sources: [ source ] })
  for await (const bindings of bindingsStream) {
    examples.push({
      url: bindings.get('query')!.value,
      comment: bindings.get('comment')!.value,
      content: bindings.get('content')!.value
    })
  }
  return examples
}

export { defaultSources, collectQueryExamples }
