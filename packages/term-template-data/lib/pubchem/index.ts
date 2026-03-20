import { type ITemplateDeclaration, splitTemplateDeclarations } from '../utils';
import type { IDataset } from '@idsm-src/types';

import detailedBioassay from './detailed/Bioassay.ejs?raw';
import detailedCompound from './detailed/Compound.ejs?raw';
import detailedConservedDomain from './detailed/ConservedDomain.ejs?raw';
import detailedGene from './detailed/Gene.ejs?raw';
import detailedPathway from './detailed/Pathway.ejs?raw';
import detailedProtein from './detailed/Protein.ejs?raw';
import detailedReference from './detailed/Reference.ejs?raw';
import detailedSubstance from './detailed/Substance.ejs?raw';

import inlineAuthor from './inline/Author.ejs?raw';
import inlineBook from './inline/Book.ejs?raw';
import inlineCell from './inline/Cell.ejs?raw';
import inlineCompound from './inline/Compound.ejs?raw';
import inlineDescriptor from './inline/Descriptor.ejs?raw';
import inlineEndpoint from './inline/Endpoint.ejs?raw';
import inlineGene from './inline/Gene.ejs?raw';
import inlineGrant from './inline/Grant.ejs?raw';
import inlinePatent from './inline/Patent.ejs?raw';
import inlinePathway from './inline/Pathway.ejs?raw';
import inlineProtein from './inline/Protein.ejs?raw';
import inlineReference from './inline/Reference.ejs?raw';
import inlineSubstance from './inline/Substance.ejs?raw';
import inlineValue from './inline/Value.ejs?raw';

const templates: ITemplateDeclaration[] = [
  {
    inline: inlineAuthor,
    pattern: /\/author\//u
  },
  {
    detailed: detailedBioassay,
    pattern: /\/bioassay\//u
  },
  {
    inline: inlineBook,
    pattern: /\/book\//u
  },
  {
    inline: inlineCell,
    pattern: /\/cell\//u
  },
  {
    detailed: detailedCompound,
    inline: inlineCompound,
    pattern: /\/compound\//u
  },
  {
    inline: inlineDescriptor,
    pattern: /\/descriptor\//u
  },
  {
    detailed: detailedConservedDomain,
    pattern: /\/conserveddomain\//u
  },
  {
    inline: inlineEndpoint,
    pattern: /\/endpoint\//u
  },
  {
    detailed: detailedGene,
    inline: inlineGene,
    pattern: /\/gene\//u
  },
  {
    inline: inlineGrant,
    pattern: /\/grant\//u
  },
  {
    inline: inlinePatent,
    pattern: /\/patent\//u
  },
  {
    detailed: detailedPathway,
    inline: inlinePathway,
    pattern: /\/pathway\//u
  },
  {
    detailed: detailedProtein,
    inline: inlineProtein,
    pattern: /\/protein\/[A-Z0-9_]+$/u
  },
  {
    detailed: detailedReference,
    inline: inlineReference,
    pattern: /\/reference\//u
  },
  {
    detailed: detailedSubstance,
    inline: inlineSubstance,
    pattern: /\/substance\//u
  },
  {
    inline: inlineValue,
    pattern: /\/(?:synonym|inchikey)\//u
  }
];

const PubChem: IDataset = {
  description: 'PubChem',
  endpoint: 'https://idsm.elixir-czech.cz/sparql/endpoint/idsm',
  pattern: /\/pubchem\//u,
  templates: splitTemplateDeclarations(templates)
};

export { PubChem };
