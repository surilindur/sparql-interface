import type { ITemplate } from './template';

interface IDataset {
  /**
   * The SPARQL endpoint URI of the dataset.
   */
  endpoint: string;
  /**
   * Description of the dataset.
   */
  description: string;
  /**
   * Pattern that determines whether the dataset can answer a given URI.
   */
  pattern: RegExp;
  /**
   * The set of templates for this endpoint.
   */
  templates: ITemplate[];
}

export type { IDataset };
