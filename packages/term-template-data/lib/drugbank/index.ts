import { type ITemplateDeclaration, splitTemplateDeclarations } from '../utils';
import type { IDataset } from '@idsm-src/types';

import detailedCompound from './detailed/Compound.ejs?raw';

import inlineCompound from './inline/Compound.ejs?raw';

const templates: ITemplateDeclaration[] = [
  {
    detailed: detailedCompound,
    inline: inlineCompound,
    pattern: /\/DB.+$/u
  }
];

const DrugBank: IDataset = {
  description: 'DrugBank',
  endpoint: 'https://idsm.elixir-czech.cz/sparql/endpoint/idsm',
  pattern: /\/DB.+$/u,
  templates: splitTemplateDeclarations(templates)
};

export { DrugBank };
