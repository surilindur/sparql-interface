import type * as RDF from '@rdfjs/types'
import type { ITemplate } from '../types/template'
import { templates as defaultTemplates } from '../defaults/templates'

// Helper cache to avoid spamming the Storage API
let templateCache: ITemplate[] | undefined

function listTemplates(): ITemplate[] {
  if (templateCache === undefined) {
    const templates: Record<string, ITemplate> = Object.fromEntries(defaultTemplates.map(t => ([ t.matcher.source, t ])))
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      const value = key ? sessionStorage.getItem(key) : null
      if (key && value) {
        templates[key] = <ITemplate>JSON.parse(value, (key, value) => key === 'matcher' ? new RegExp(value) : value)
      }
    }
    templateCache = Object.values(templates)
    templateCache.sort((a, b) => a.matcher.source < b.matcher.source ? -1 : 1)
  }
  return templateCache
}

function findTemplates(entity: RDF.Term): ITemplate[] {
  const matchingTemplates: { matchLength: number, template: ITemplate }[] = []
  for (const template of listTemplates()) {
    const match = template.matcher.exec(entity.value)
    if (match?.[0]) {
      matchingTemplates.push({ matchLength: match[0].length, template })
    }
  }
  matchingTemplates.sort((a, b) => a.matchLength < b.matchLength ? -1 : 1)
  return matchingTemplates.map(m => m.template)
}

function saveTemplate(template: ITemplate): ITemplate[] {
  const key = template.matcher.source
  const value = JSON.stringify(template, (key, value) => key === 'matcher' ? (<RegExp>value).source : value)
  sessionStorage.setItem(key, value)
  templateCache = undefined
  return listTemplates()
}

function resetTemplate(template: ITemplate): ITemplate[] {
  const key = template.matcher.source
  sessionStorage.removeItem(key)
  templateCache = undefined
  return listTemplates()
}

function resetAllTemplates(): ITemplate[] {
  sessionStorage.clear()
  templateCache = undefined
  return listTemplates()
}

export { findTemplates, listTemplates, saveTemplate, resetTemplate, resetAllTemplates }
