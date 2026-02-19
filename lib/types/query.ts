interface IQuery {
  /**
   * The description of the query.
   */
  comment: string;
  /**
   * The actual query string.
   */
  content: string;
}

export type { IQuery }
