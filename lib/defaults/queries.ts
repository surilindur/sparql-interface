import type { IQuery } from '../types/query'
import { splitCommentFromQuery } from '../logic/query'

import random100Triples from '../queries/extract-first-triples.rq?raw'
import extractQueryExamplesRaw from '../queries/extract-query-examples.rq?raw'
import extractEntityLabelRaw from '../queries/extract-entity-label.rq?raw'

const queries: IQuery[] = [
  random100Triples
].map(q => splitCommentFromQuery(q))

const extractQueryExamples = splitCommentFromQuery(extractQueryExamplesRaw).content
const extractEntityLabel = splitCommentFromQuery(extractEntityLabelRaw).content

export { queries, extractQueryExamples, extractEntityLabel }
