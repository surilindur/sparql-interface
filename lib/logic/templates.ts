import type * as RDF from '@rdfjs/types'
import ejs from 'ejs'
import type { ITermTemplate, ITermTemplateCollection, ITermTemplateContext } from './types'
import { queryEngine } from './query'
import { select } from './queryselect'
import { ask } from './queryask'

import collectionsQuery from '../queries/collections.rq?raw'
import templatesQuery from '../queries/templates.rq?raw'

const defaultSources: string[] = [
  'https://idsm.localhost/templates/chebi',
  'https://idsm.localhost/templates/chembl',
  'https://idsm.localhost/templates/drugbank',
  'https://idsm.localhost/templates/generic',
  'https://idsm.localhost/templates/isdb',
  'https://idsm.localhost/templates/mesh',
  'https://idsm.localhost/templates/mona',
  'https://idsm.localhost/templates/pubchem',
  'https://idsm.localhost/templates/uniprot',
  'https://idsm.localhost/templates/wikidata'
]

async function listTemplateCollections(): Promise<ITermTemplateCollection[]> {
  const collections: ITermTemplateCollection[] = []
  const collectionEnablement: Record<string, boolean> = {}
  if (sessionStorage.length === 0) {
    for (const source of defaultSources) {
      sessionStorage.setItem(source, 'true')
    }
  }
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i)
    if (key) {
      collectionEnablement[key] = sessionStorage.getItem(key) === 'true'
    }
  }
  const bindingsStream = await queryEngine.queryBindings(collectionsQuery, { sources: Object.keys(collectionEnablement) })
  for await (const bindings of bindingsStream) {
    const url = bindings.get('collection')!.value
    const name = bindings.get('name')!.value
    const description = bindings.get('description')!.value
    collections.push({
      description,
      enabled: collectionEnablement[url],
      name,
      url
    })
  }
  return collections
}

function removeTemplateCollection(url: string): Promise<ITermTemplateCollection[]> {
  sessionStorage.removeItem(url)
  return listTemplateCollections()
}

async function enableTemplateCollection(url: string): Promise<ITermTemplateCollection[]> {
  sessionStorage.setItem(url, 'true')
  return listTemplateCollections()
}

async function disableTemplateCollection(url: string): Promise<ITermTemplateCollection[]> {
  sessionStorage.setItem(url, 'false')
  return listTemplateCollections()
}

async function findApplicableTemplates(term: RDF.Term): Promise<ITermTemplate[]> {
  const collections = await listTemplateCollections()
  const templates: ITermTemplate[] = []
  const bindingsSTream = await queryEngine.queryBindings(templatesQuery, { sources: collections.map(c => c.url) })
  for await (const bindings of bindingsSTream) {
    const pattern = new RegExp(bindings.get('pattern')!.value, 'u')
    if (pattern.test(term.value)) {
      templates.push({
        url: bindings.get('template')!.value,
        content: bindings.get('content')!.value,
        matcher: pattern,
        type: bindings.get('fragment')!.value === 'true' ? 'fragment' : 'inline',
        target: bindings.get('target')?.value
      })
    }
  }
  return templates
}

async function visualiseTerm(term: RDF.Term | undefined, source: string): Promise<string> {
  if (term) {
    for (const template of await findApplicableTemplates(term)) {
      if (template.type === 'inline') {
        const context: ITermTemplateContext = {
          term,
          queryAsk: (query, bindings) => ask(template.target ?? source, query, bindings ?? []),
          querySelect: (query, bindings) => select(template.target ?? source, query, bindings ?? []),
          visualiseTerm: (entity) => visualiseTerm(entity, template.target ?? source)
        }
        return await ejs.render(template.content, context, { async: true })
      }
    }
  }
  return `<pre>${JSON.stringify(term, undefined, 2)}</pre>`
}

async function visualiseTermFragments(term: RDF.Term, source: string): Promise<string> {
  const visualisations: Promise<string>[] = []

  if (term) {
    for (const template of await findApplicableTemplates(term)) {
      if (template.type === 'fragment') {
        const context: ITermTemplateContext = {
          term,
          queryAsk: (query, bindings) => ask(template.target ?? source, query, bindings ?? []),
          querySelect: (query, bindings) => select(template.target ?? source, query, bindings ?? []),
          visualiseTerm: (entity) => visualiseTerm(entity, template.target ?? source)
        }
        visualisations.push(ejs.render(template.content, context, { async: true }))
      }
    }
  }

  if (visualisations.length > 0) {
    const outputs = await Promise.all(visualisations)
    return outputs.join('\n')
  }

  return `<pre>${JSON.stringify(term, undefined, 2)}</pre>`
}

export { listTemplateCollections, removeTemplateCollection, enableTemplateCollection, disableTemplateCollection, visualiseTerm, visualiseTermFragments }
