import { type ITemplateDeclaration, splitTemplateDeclarations } from '../utils';
import type { IDataset } from '@idsm-src/types';

import detailedCompound from './detailed/Compound.ejs?raw';

import inlineCompound from './inline/Compound.ejs?raw';

const templates: ITemplateDeclaration[] = [
  {
    detailed: detailedCompound,
    inline: inlineCompound,
    pattern: /\/entity\/Q/u
  }
];

const Wikidata: IDataset = {
  description: 'Wikidata',
  endpoint: 'https://query.wikidata.org/sparql',
  pattern: /wikidata\.org\//u,
  templates: splitTemplateDeclarations(templates)
};

export { Wikidata };
