import { type ITemplateDeclaration, splitTemplateDeclarations } from '../utils';
import type { IDataset } from '@idsm-src/types';

import detailedMolfile from './detailed/Molfile.ejs?raw';
import detailedSubstance from './detailed/Substance.ejs?raw';

import inlineActivity from './inline/Activity.ejs?raw';
import inlineAssay from './inline/Assay.ejs?raw';
import inlineBioComponent from './inline/BioComponent.ejs?raw';
import inlineCellLine from './inline/CellLine.ejs?raw';
import inlineDrugIndication from './inline/DrugIndication.ejs?raw';
import inlineMechanism from './inline/Mechanism.ejs?raw';
import inlineMolecule from './inline/Molecule.ejs?raw';
import inlineSource from './inline/Source.ejs?raw';
import inlineSubstance from './inline/Substance.ejs?raw';
import inlineTargetComponent from './inline/TargetComponent.ejs?raw';

const templates: ITemplateDeclaration[] = [
  {
    inline: inlineActivity,
    pattern: /\/activity\//u
  },
  {
    inline: inlineAssay,
    pattern: /\/assay\//u
  },
  {
    inline: inlineBioComponent,
    pattern: /\/biocomponent\//u
  },
  {
    inline: inlineCellLine,
    pattern: /\/cellline\//u
  },
  {
    inline: inlineDrugIndication,
    pattern: /\/drugindication\//u
  },
  {
    inline: inlineMechanism,
    pattern: /\/mechanism\//u
  },
  {
    inline: inlineMolecule,
    pattern: /\/molecule\//u
  },
  {
    inline: inlineSource,
    pattern: /\/source\//u
  },
  {
    detailed: detailedMolfile,
    pattern: /_Molfile$/u
  },
  {
    detailed: detailedSubstance,
    inline: inlineSubstance,
    pattern: /\/CHEMBL[0-9]+$/u
  },
  {
    inline: inlineTargetComponent,
    pattern: /\/targetcomponent\//u
  }
];

const ChEMBL: IDataset = {
  description: 'ChEMBL',
  endpoint: 'https://idsm.elixir-czech.cz/sparql/endpoint/idsm',
  pattern: /\/chembl\//u,
  templates: splitTemplateDeclarations(templates)
};

export { ChEMBL };
