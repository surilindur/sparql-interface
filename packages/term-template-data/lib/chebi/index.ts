import { type ITemplateDeclaration, splitTemplateDeclarations } from '../utils';
import type { IDataset } from '@idsm-src/types';

import detailedCompound from './detailed/Compound.ejs?raw';
import detailedMolfile from './detailed/Molfile.ejs?raw';

import inlineCompound from './inline/Compound.ejs?raw';

const templates: ITemplateDeclaration[] = [
  {
    detailed: detailedCompound,
    inline: inlineCompound,
    pattern: /\/CHEBI_[0-9]+$/u
  },
  {
    detailed: detailedMolfile,
    pattern: /\/CHEBI_[0-9]+_Molfile$/u
  }
];

const ChEBI: IDataset = {
  description: 'ChEBI',
  endpoint: 'https://idsm.elixir-czech.cz/sparql/endpoint/idsm',
  pattern: /\/obo\/CHEBI_/u,
  templates: splitTemplateDeclarations(templates)
};

export { ChEBI };
