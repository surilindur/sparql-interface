import { type ITemplateDeclaration, splitTemplateDeclarations } from '../utils';
import type { IDataset } from '@idsm-src/types';

import detailedCompound from './detailed/Compound.ejs?raw';
import detailedExperiment from './detailed/Experiment.ejs?raw';
import detailedLibrary from './detailed/Library.ejs?raw';
import detailedSpectrum from './detailed/Spectrum.ejs?raw';
import detailedSubmitter from './detailed/Submitter.ejs?raw';

import inlineCompound from './inline/Compound.ejs?raw';
import inlineDescriptor from './inline/Descriptor.ejs?raw';
import inlineExperiment from './inline/Experiment.ejs?raw';
import inlinePeak from './inline/Peak.ejs?raw';
import inlineSubmitter from './inline/Submitter.ejs?raw';
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
    inline: inlineExperiment,
    pattern: /\/.+_EXP$/u
  },
  {
    detailed: detailedLibrary,
    pattern: /\/.+_library$/u
  },
  {
    inline: inlinePeak,
    pattern: /\/.+_PEAK$/u
  },
  {
    detailed: detailedSpectrum,
    pattern: /\/.+_MS$/u
  },
  {
    detailed: detailedSubmitter,
    inline: inlineSubmitter,
    pattern: /\/.+_submitter$/u
  },
  {
    inline: inlineTypedDescriptor,
    pattern: /\/.+_TD$/u
  }
];

const MoNA: IDataset = {
  description: 'MoNA',
  endpoint: 'https://idsm.elixir-czech.cz/sparql/endpoint/idsm',
  pattern: /\/mona\//u,
  templates: splitTemplateDeclarations(templates)
};

export { MoNA };
