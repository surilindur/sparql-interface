import type { IDataset } from '../types/dataset'

const datasets: IDataset[] = [
  {
    description: 'Wikidata',
    endpoint: 'https://query.wikidata.org/sparql'
  },
  {
    description: 'IDSM',
    endpoint: 'https://idsm.elixir-czech.cz/sparql/endpoint/idsm'
  },
  {
    description: 'UniProt',
    endpoint: 'https://sparql.uniprot.org/sparql'
  }
]

export { datasets }
