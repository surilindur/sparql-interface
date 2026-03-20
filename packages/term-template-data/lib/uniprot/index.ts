import { type ITemplateDeclaration, splitTemplateDeclarations } from '../utils';
import type { IDataset } from '@idsm-src/types';

import inlineProtein from './inline/Protein.ejs?raw';

const templates: ITemplateDeclaration[] = [
  {
    inline: inlineProtein,
    pattern: /\/protein\/[A-Z][0-9]+$/u
  }
];

const UniProt: IDataset = {
  description: 'UniProt',
  endpoint: 'https://sparql.uniprot.org/sparql',
  pattern: /\/uniprot\//u,
  templates: splitTemplateDeclarations(templates)
};

export { UniProt };
