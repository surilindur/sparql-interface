import { ChEBI } from './chebi';
import { ChEMBL } from './chembl';
import { DrugBank } from './drugbank';
import { Generic } from './generic';
import type { IDataset } from '@idsm-src/types';
import { ISDB } from './isdb';
import { MESH } from './mesh';
import { MoNA } from './mona';
import { PubChem } from './pubchem';
import { UniProt } from './uniprot';
import { Wikidata } from './wikidata';

const datasets: IDataset[] = [
  ChEBI,
  ChEMBL,
  DrugBank,
  Generic,
  ISDB,
  MESH,
  MoNA,
  PubChem,
  UniProt,
  Wikidata
];

export { datasets };
