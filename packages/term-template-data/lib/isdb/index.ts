import { type ITemplateDeclaration, splitTemplateDeclarations } from '../utils';
import type { IDataset } from '@idsm-src/types';

import detailedCompound from './detailed/Compound.ejs?raw';
import detailedExperiment from './detailed/Experiment.ejs?raw';
import detailedSpectrum from './detailed/Spectrum.ejs?raw';

import inlineCompound from './inline/Compound.ejs?raw';
import inlineDescriptor from './inline/Descriptor.ejs?raw';
import inlineTypedDescriptor from './inline/TypedDescriptor.ejs?raw';

const templates: ITemplateDeclaration[] = [
  {
    detailed: detailedCompound,
    inline: inlineCompound,
    pattern: /\/.+_CMPD$/u
  },
  {
    inline: inlineDescriptor,
    pattern: /\/.+_DESC$/u
  },
  {
    detailed: detailedExperiment,
    pattern: /\/.+_EXP$/u
  },
  {
    detailed: detailedSpectrum,
    pattern: /\/.+_MS$/u
  },
  {
    inline: inlineTypedDescriptor,
    pattern: /\/.+_TD$/u
  }
];

const ISDB: IDataset = {
  description: 'ISDB',
  endpoint: 'https://idsm.elixir-czech.cz/sparql/endpoint/idsm',
  pattern: /\/isdb\//u,
  templates: splitTemplateDeclarations(templates)
};

export { ISDB };
