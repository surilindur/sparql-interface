import type * as RDF from '@rdfjs/types'
import type { IBindings } from './types'

function bindingsToRecord(bindings: RDF.Bindings): IBindings {
  const record: IBindings = {}
  for (const [ key, value ] of bindings) {
    record[key.value] = <RDF.Literal | RDF.NamedNode>value
  }
  return record
}

export { bindingsToRecord }
