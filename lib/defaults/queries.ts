import type { IQuery } from '../types/query'
import { splitCommentFromQuery } from '../logic/query'

import random100Triples from '../queries/extract-first-triples.rq?raw'
import extractQueryExamplesRaw from '../queries/extract-query-examples.rq?raw'

const queries: IQuery[] = [
  random100Triples
].map(q => splitCommentFromQuery(q))

const extractQueryExamples = splitCommentFromQuery(extractQueryExamplesRaw).content

export { queries, extractQueryExamples }
