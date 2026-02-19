import type { ITemplate } from '../types/template'

// Item templates for short inline visualisations

import itemChebiCompound from '../templates/item/chebi/Compound.ejs?raw'

import itemChemblAssay from '../templates/item/chembl/Assay.ejs?raw'
import itemChemblBindingSite from '../templates/item/chembl/BindingSite.ejs?raw'
import itemChemblBioComponent from '../templates/item/chembl/BioComponent.ejs?raw'
import itemChemblCellLine from '../templates/item/chembl/CellLine.ejs?raw'
import itemChemblDrugIndication from '../templates/item/chembl/DrugIndication.ejs?raw'
import itemChemblMechanism from '../templates/item/chembl/Mechanism.ejs?raw'
import itemChemblSource from '../templates/item/chembl/Source.ejs?raw'
import itemChemblSubstance from '../templates/item/chembl/Substance.ejs?raw'
import itemChemblTargetComponent from '../templates/item/chembl/TargetComponent.ejs?raw'

import itemDrugbankCompound from '../templates/item/drugbank/Compound.ejs?raw'

import itemGenericLiteral from '../templates/item/generic/Literal.ejs?raw'
import itemGenericNamedNode from '../templates/item/generic/NamedNode.ejs?raw'

import itemIsdbCompound from '../templates/item/isdb/Compound.ejs?raw'
import itemIsdbDescriptor from '../templates/item/isdb/Descriptor.ejs?raw'
import itemIsdbTypedDescriptor from '../templates/item/isdb/TypedDescriptor.ejs?raw'

import itemMeshMesh from '../templates/item/mesh/Mesh.ejs?raw'

import itemMonaCompound from '../templates/item/mona/Compound.ejs?raw'
import itemMonaDescriptor from '../templates/item/mona/Descriptor.ejs?raw'
import itemMonaExperiment from '../templates/item/mona/Experiment.ejs?raw'
import itemMonaPeak from '../templates/item/mona/Peak.ejs?raw'
import itemMonaSubmitter from '../templates/item/mona/Submitter.ejs?raw'
import itemMonaTypedDescriptor from '../templates/item/mona/TypedDescriptor.ejs?raw'

import itemPubchemAuthor from '../templates/item/pubchem/Author.ejs?raw'
import itemPubchemBook from '../templates/item/pubchem/Book.ejs?raw'
import itemPubchemCell from '../templates/item/pubchem/Cell.ejs?raw'
import itemPubchemCompound from '../templates/item/pubchem/Compound.ejs?raw'
import itemPubchemCompoundDescriptor from '../templates/item/pubchem/CompoundDescriptor.ejs?raw'
import itemPubchemEndpoint from '../templates/item/pubchem/Endpoint.ejs?raw'
import itemPubchemGene from '../templates/item/pubchem/Gene.ejs?raw'
import itemPubchemGrant from '../templates/item/pubchem/Grant.ejs?raw'
import itemPubchemPathway from '../templates/item/pubchem/Pathway.ejs?raw'
import itemPubchemPatent from '../templates/item/pubchem/Patent.ejs?raw'
import itemPubchemProtein from '../templates/item/pubchem/Protein.ejs?raw'
import itemPubchemReference from '../templates/item/pubchem/Reference.ejs?raw'
import itemPubchemSubstance from '../templates/item/pubchem/Substance.ejs?raw'

import itemWikidataCompound from '../templates/item/wikidata/Compound.ejs?raw'

// Page templates for long full-page visualisations

import pageChebiCompound from '../templates/page/chebi/Compound.ejs?raw'

import pageChemblSubstance from '../templates/page/chembl/Substance.ejs?raw'

import pageDrugbankCompound from '../templates/page/drugbank/Compound.ejs?raw'

import pageIsdbCompound from '../templates/page/isdb/Compound.ejs?raw'
import pageIsdbExperiment from '../templates/page/isdb/Experiment.ejs?raw'
import pageIsdbSpectrum from '../templates/page/isdb/Spectrum.ejs?raw'

import pageGenericLiteral from '../templates/page/generic/Literal.ejs?raw'
import pageGenericProperties from '../templates/page/generic/Properties.ejs?raw'
import pageGenericTitle from '../templates/page/generic/Title.ejs?raw'
import pageGenericTypes from '../templates/page/generic/Types.ejs?raw'

import pageMonaCompound from '../templates/page/mona/Compound.ejs?raw'
import pageMonaExperiment from '../templates/page/mona/Experiment.ejs?raw'
import pageMonaLibrary from '../templates/page/mona/Library.ejs?raw'
import pageMonaSpectrum from '../templates/page/mona/Spectrum.ejs?raw'
import pageMonaSubmitter from '../templates/page/mona/Submitter.ejs?raw'

import pagePubchemBioassay from '../templates/page/pubchem/Bioassay.ejs?raw'
import pagePubchemCompound from '../templates/page/pubchem/Compound.ejs?raw'
import pagePubchemConservedDomain from '../templates/page/pubchem/ConservedDomain.ejs?raw'
import pagePubchemGene from '../templates/page/pubchem/Gene.ejs?raw'
import pagePubchemPathway from '../templates/page/pubchem/Pathway.ejs?raw'
import pagePubchemProtein from '../templates/page/pubchem/Protein.ejs?raw'
import pagePubchemReference from '../templates/page/pubchem/Reference.ejs?raw'
import pagePubchemSubstance from '../templates/page/pubchem/Substance.ejs?raw'

import pageWikidataCompound from '../templates/page/wikidata/Compound.ejs?raw'

const templates: ITemplate[] = [
  {
    matcher: /^(?![a-z]+:).+$/,
    item: itemGenericLiteral,
    page: pageGenericLiteral
  },
  {
    matcher: /^[a-z]+:.+$/,
    item: itemGenericNamedNode,
    page: pageGenericTypes
  },
  {
    matcher: /:/,
    page: pageGenericTitle
  },
  {
    matcher: /.+/,
    page: pageGenericProperties
  },
  {
    matcher: /\/chembl\/assay\//,
    item: itemChemblAssay
  },
  {
    matcher: /\/chembl\/bindingsite\//,
    item: itemChemblBindingSite
  },
  {
    matcher: /\/chembl\/biocomponent\//,
    item: itemChemblBioComponent
  },
  {
    matcher: /\/chembl\/cellline\//,
    item: itemChemblCellLine
  },
  {
    matcher: /\/chembl\/drugindication\//,
    item: itemChemblDrugIndication
  },
  {
    matcher: /\/chembl\/mechanism\//,
    item: itemChemblMechanism
  },
  {
    matcher: /\/chembl\/source\//,
    item: itemChemblSource
  },
  {
    matcher: /\/CHEMBL(.+)$/,
    item: itemChemblSubstance,
    page: pageChemblSubstance
  },
  {
    matcher: /\/chembl\/targetcomponent\//,
    item: itemChemblTargetComponent
  },
  {
    matcher: /\/DB.+$/,
    item: itemDrugbankCompound,
    page: pageDrugbankCompound
  },
  {
    matcher: /\/isdb\/.+_CMPD$/,
    item: itemIsdbCompound,
    page: pageIsdbCompound
  },
  {
    matcher: /\/isdb\/.+_DESC$/,
    item: itemIsdbDescriptor
  },
  {
    matcher: /\/isdb\/.+_EXP$/,
    page: pageIsdbExperiment
  },
  {
    matcher: /\/isdb\/.+_MS$/,
    page: pageIsdbSpectrum
  },
  {
    matcher: /\/isdb\/.+_TD$/,
    item: itemIsdbTypedDescriptor
  },
  {
    matcher: /\/mesh\//,
    item: itemMeshMesh
  },
  {
    matcher: /\/mona\/.+_CMPD$/,
    item: itemMonaCompound,
    page: pageMonaCompound
  },
  {
    matcher: /\/mona\/.+_DESC$/,
    item: itemMonaDescriptor
  },
  {
    matcher: /\/mona\/.+_EXP$/,
    item: itemMonaExperiment,
    page: pageMonaExperiment
  },
  {
    matcher: /\/mona\/.+_library$/,
    page: pageMonaLibrary
  },
  {
    matcher: /\/mona\/.+_PEAK$/,
    item: itemMonaPeak
  },
  {
    matcher: /\/mona\/.+_MS$/,
    page: pageMonaSpectrum
  },
  {
    matcher: /\/mona\/.+_submitter$/,
    item: itemMonaSubmitter,
    page: pageMonaSubmitter
  },
  {
    matcher: /\/mona\/.+_TDES$/,
    item: itemMonaTypedDescriptor
  },
  {
    matcher: /\/CHEBI_.+$/,
    item: itemChebiCompound,
    page: pageChebiCompound
  },
  {
    matcher: /\/pubchem\/author\//,
    item: itemPubchemAuthor
  },
  {
    matcher: /\/pubchem\/bioassay\//,
    page: pagePubchemBioassay
  },
  {
    matcher: /\/pubchem\/book\//,
    item: itemPubchemBook
  },
  {
    matcher: /\/pubchem\/cell\//,
    item: itemPubchemCell
  },
  {
    matcher: /\/pubchem\/compound\//,
    page: pagePubchemCompound,
    item: itemPubchemCompound
  },
  {
    matcher: /\/pubchem\/descriptor\//,
    item: itemPubchemCompoundDescriptor
  },
  {
    matcher: /\/pubchem\/endpoint\//,
    item: itemPubchemEndpoint
  },
  {
    matcher: /\/pubchem\/conserveddomain\//,
    page: pagePubchemConservedDomain
  },
  {
    matcher: /\/pubchem\/gene\//,
    page: pagePubchemGene,
    item: itemPubchemGene
  },
  {
    matcher: /\/pubchem\/grant\//,
    item: itemPubchemGrant
  },
  {
    matcher: /\/pubchem\/pathway\//,
    item: itemPubchemPathway,
    page: pagePubchemPathway
  },
  {
    matcher: /\/pubchem\/patent\//,
    item: itemPubchemPatent
  },
  {
    matcher: /\/pubchem\/protein\//,
    item: itemPubchemProtein,
    page: pagePubchemProtein
  },
  {
    matcher: /\/pubchem\/reference\//,
    page: pagePubchemReference,
    item: itemPubchemReference
  },
  {
    matcher: /\/pubchem\/substance\//,
    item: itemPubchemSubstance,
    page: pagePubchemSubstance
  },
  {
    matcher: /\/entity\/Q/,
    item: itemWikidataCompound,
    page: pageWikidataCompound
  }
]

export { templates }
