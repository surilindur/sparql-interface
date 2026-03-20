import type * as RDF from '@rdfjs/types';

type TemplateType = 'inline' | 'detailed';

type TemplateBindings = Record<string, RDF.Term>;

interface ITemplate {
  /**
   * Expression to determine if the template applies to a given value.
   */
  pattern: RegExp;
  /**
   * The type of the template.
   */
  type: TemplateType;
  /**
   * The content of the template.
   */
  content: string;
}

interface ITemplateContext extends Record<string, unknown> {
  entity: RDF.Term;
  queryAsk: (query: string, bindings?: TemplateBindings[]) => Promise<boolean>;
  querySelectAll: (query: string, bindings?: TemplateBindings[]) => Promise<TemplateBindings[]>;
  querySelectFirst: (query: string, bindings?: TemplateBindings[]) => Promise<TemplateBindings | undefined>;
  visualise: (entity: RDF.Term) => Promise<string | undefined>;
  visualiseTypes: (entity: RDF.Term) => Promise<string | undefined>;
}

export type { TemplateBindings, TemplateType, ITemplate, ITemplateContext };
