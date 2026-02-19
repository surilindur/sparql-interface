<script setup lang="ts">
import type * as RDF from '@rdfjs/types'
import { ref } from 'vue'
import { visualiseItem, visualisePage } from './logic/visualisation'

import DetailsView from './views/DetailsView.vue'
import EditorView from './views/EditorView.vue'
import ResultView from './views/ResultView.vue'
import TemplateView from './views/TemplateView.vue'

const domParser = new DOMParser()
const inspectedEntity = ref<RDF.Term>()
const editTemplates = ref<boolean>(false)
const queryRunning = ref<boolean>(false)

const currentEndpoint = ref<string>()
const currentQuery = ref<string>()

function executeQuery(endpoint: string, query: string): void {
  queryRunning.value = true
  currentEndpoint.value = endpoint
  currentQuery.value = query
}
</script>

<template>
  <DetailsView
    v-if="inspectedEntity"
    :entity="inspectedEntity"
    :dom-parser="domParser"
    :visualise="(e) => visualisePage(e, currentEndpoint!)"
    @close="inspectedEntity = undefined"
  />
  <ResultView
    v-if="queryRunning && currentEndpoint && currentQuery"
    v-show="!inspectedEntity"
    :endpoint="currentEndpoint!"
    :visualise="(e) => visualiseItem(e, currentEndpoint!)"
    :query="currentQuery"
    :dom-parser="domParser"
    @close="queryRunning = false"
    @inspect="(entity: RDF.Term | undefined) => inspectedEntity = entity"
  />
  <TemplateView
    v-if="editTemplates"
    @close="editTemplates = false"
  />
  <EditorView
    v-show="!queryRunning && !editTemplates"
    @execute="executeQuery"
    @templates="editTemplates = true"
  />
</template>
