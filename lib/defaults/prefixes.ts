const prefixes: Record<string, string> = {
  // PubChem
  compound: 'http://rdf.ncbi.nlm.nih.gov/pubchem/compound/',
  descriptor: 'http://rdf.ncbi.nlm.nih.gov/pubchem/descriptor/',
  protein: 'http://rdf.ncbi.nlm.nih.gov/pubchem/protein/',
  pubchem: 'http://rdf.ncbi.nlm.nih.gov/pubchem/',
  substance: 'http://rdf.ncbi.nlm.nih.gov/pubchem/substance/',
  // Other
  sio: 'http://semanticscience.org/resource/',
  dataset: 'http://bioinfo.iocb.cz/dataset/',
  ebi: 'http://rdf.ebi.ac.uk/dataset/',
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  owl: 'http://www.w3.org/2002/07/owl#',
  obo: 'http://purl.obolibrary.org/obo/',
  skos: 'http://www.w3.org/2004/02/skos/core#',
  bao: 'http://www.bioassayontology.org/bao#',
  up: 'http://purl.uniprot.org/core/',
  bp: 'http://www.biopax.org/release/biopax-level3.owl#',
  dcterms: 'http://purl.org/dc/terms/',
  vocab: 'http://rdf.ncbi.nlm.nih.gov/pubchem/vocabulary#'
}

export { prefixes }
