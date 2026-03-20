import { type ITemplateDeclaration, splitTemplateDeclarations } from '../utils';
import type { IDataset } from '@idsm-src/types';

import inlineMesh from './inline/Mesh.ejs?raw';

const templates: ITemplateDeclaration[] = [
  {
    inline: inlineMesh,
    pattern: /\/mesh\//u
  }
];

const MESH: IDataset = {
  description: 'MESH',
  endpoint: 'https://idsm.elixir-czech.cz/sparql/endpoint/idsm',
  pattern: /\/mesh\//u,
  templates: splitTemplateDeclarations(templates)
};

export { MESH };
