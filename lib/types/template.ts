import type * as RDF from '@rdfjs/types'
import type { Data } from 'ejs'
import type { IBindings } from 'fetch-sparql-endpoint'

type ITemplate = {
  matcher: RegExp;
  item?: string;
  page?: string;
}

interface ITemplateContext extends Data {
  entity: RDF.Term;
  visualise: (term: RDF.Term) => Promise<string | undefined>;
  select: (query: string, bindings?: IBindings[], endpoint?: string) => Promise<IBindings[]>;
  ask: (query: string, bindings?: IBindings[], endpoint?: string) => Promise<boolean>;
  hash: (data: string) => string;
  label: (entity: RDF.Term, endpoint?: string) => Promise<string>;
}

export type { ITemplate, ITemplateContext }
