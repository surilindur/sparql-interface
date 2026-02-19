import type * as RDF from '@rdfjs/types'
import ejs from 'ejs'
import MurmurHash3 from 'imurmurhash'

import type { ITemplateContext } from '../types/template'
import { findTemplates } from './template'
import { select } from './queryselect'
import { ask } from './queryask'

const emptyString = ''

function hash(data: string): string {
  return MurmurHash3(data).result().toString(16)
}

function uriToLabel(uri: string): string {
  if (!uri.includes('?')) {
    const potentialLabels = [
      uri.split('#').at(1)?.trim() ?? '',
      ...uri.split('#')[0]!.split('/').map(s => s.trim()).reverse()
    ]
    for (const label of potentialLabels) {
      if (label.length > 0) {
        return label
      }
    }
  }
  return uri
}

async function visualiseItem(entity: RDF.Term | undefined, endpoint: string): Promise<string> {
  if (entity) {
    for (const template of findTemplates(entity)) {
      if (template.item) {
        const context: ITemplateContext = {
          entity,
          hash,
          uriToLabel,
          visualise: (entity: RDF.Term) => visualiseItem(entity, endpoint),
          select: (query, bindings, source) => select(source ?? endpoint, query, bindings ?? []),
          ask: (query, bindings, source) => ask(source ?? endpoint, query, bindings ?? [])
        }
        return await ejs.render(template.item, context, { async: true })
      }
    }
    return `<pre>${JSON.stringify(entity, undefined, 2)}</pre>`
  }
  return emptyString
}

async function visualisePage(entity: RDF.Term, endpoint: string): Promise<string> {
  const visualisations: Promise<string>[] = []

  const context: ITemplateContext = {
    entity,
    hash,
    uriToLabel,
    visualise: (entity: RDF.Term) => visualiseItem(entity, endpoint),
    select: (query, bindings, source) => select(source ?? endpoint, query, bindings ?? []),
    ask: (query, bindings, source) => ask(source ?? endpoint, query, bindings ?? [])
  }

  for (const template of findTemplates(entity)) {
    if (template.page) {
      visualisations.push(ejs.render(template.page, context, { async: true }))
    }
  }

  if (visualisations.length > 0) {
    const outputs = await Promise.all(visualisations)
    return outputs.join('\n')
  }

  return `<pre>${JSON.stringify(entity, undefined, 2)}</pre>`
}

export { visualiseItem, visualisePage }
