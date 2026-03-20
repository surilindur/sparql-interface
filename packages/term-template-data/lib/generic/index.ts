import { type ITemplateDeclaration, splitTemplateDeclarations } from '../utils';
import type { IDataset } from '@idsm-src/types';

import detailedProperties from './detailed/Properties.ejs?raw';
import detailedTypes from './detailed/Types.ejs?raw';

import inlineLiteral from './inline/Literal.ejs?raw';
import inlineNamedNode from './inline/NamedNode.ejs?raw';

const namedNodePattern = /^[a-z]+:/u;
const literalPattern = /^(?![a-z]+:)/u;

const templates: ITemplateDeclaration[] = [
  {
    detailed: detailedTypes,
    pattern: namedNodePattern
  },
  {
    detailed: detailedProperties,
    pattern: namedNodePattern
  },
  {
    inline: inlineNamedNode,
    pattern: namedNodePattern
  },
  {
    inline: inlineLiteral,
    pattern: literalPattern
  }
];

const Generic: IDataset = {
  description: 'Generic',
  endpoint: 'https://idsm.elixir-czech.cz/sparql/endpoint/idsm',
  pattern: /.?/u,
  templates: splitTemplateDeclarations(templates)
};

export { Generic };
