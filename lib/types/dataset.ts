interface IDataset {
  /**
   * The SPARQL endpoint URI of the dataset.
   */
  endpoint: string;
  /**
   * Description of the dataset.
   */
  description: string;
}

export type { IDataset }
