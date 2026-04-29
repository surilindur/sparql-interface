import type * as RDF from '@rdfjs/types'
import type { Data } from 'ejs'

type IBindings = Record<string, RDF.NamedNode | RDF.Literal>

interface IQuerySource {
  /**
   * The URL of the source.
   */
  url: string
  /**
   * The description of the source.
   */
  description: string
}

interface IQueryExample {
  /**
   * The URL of the query example.
   */
  url: string
  /**
   * Description of the query example.
   */
  comment: string
  /**
   * The query string of the example.
   */
  content: string
}

type ITermTemplate = {
  /**
   * The URL of the template.
   */
  url: string
  /**
   * Whether the template is intended for inline use, or is part of a larger visualisation.
   */
  type: 'fragment' | 'inline'
  /**
   * The RDF term value is tested against this expression.
   */
  matcher: RegExp
  /**
   * The template content string.
   */
  content: string
  /**
   * The target of all queries in this template.
   */
  target?: string
}

interface ITermTemplateCollection {
  /**
   * The URL of the collection.
   */
  url: string
  /**
   * The name of the template collection.
   */
  name: string
  /**
   * The description of the collection.
   */
  description: string
  /**
   * Whether the collection is enabled.
   */
  enabled: boolean
}

interface ITermTemplateContext extends Data {
  /**
   * The current RDF term being visualised.
   */
  term: RDF.Term
  /**
   * Generate an HTML visualisation of the specified RDF term.
   */
  visualiseTerm: (term: RDF.Term) => Promise<string | undefined>
  /**
   * Execute a SPARQL SELECT query against the current endpoint.
   */
  querySelect: (query: string, bindings?: IBindings[]) => Promise<IBindings[]>
  /**
   * Execute a SPARQL ASK query against the current endpoint.
   */
  queryAsk: (query: string, bindings?: IBindings[]) => Promise<boolean>
}

export type { IBindings, IQuerySource, IQueryExample, ITermTemplate, ITermTemplateCollection, ITermTemplateContext }
