<script setup lang="ts">
import QueryEditor from '../components/QueryEditor.vue'
import QuerySource from '../components/QuerySource.vue'
import { datasets as defaultDatasets } from '../defaults/datasets'
import { queries as defaultQueries } from '../defaults/queries'
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'execute', endpoint: string, query: string): void,
  (e: 'templates'): void,
}>()

const defaultQuery = ref<string>()
const currentQuery = ref<string>()
const currentEndpoint = ref<string>()

function onQuerySelect(query: string | undefined): void {
  currentQuery.value = query
  defaultQuery.value = query
}

function onEndpointSelect(endpoint: string): void {
  currentEndpoint.value = endpoint
}

</script>

<template>
  <section class="sparqleditor">
    <nav>
      <h1>SPARQL Editor</h1>
      <button
        :disabled="!currentQuery || currentQuery.trim().length === 0 || !currentEndpoint || currentEndpoint.trim().length === 0"
        @click="emit('execute', currentEndpoint!, currentQuery!)"
      >
        Execute
      </button>
      <button @click="() => emit('templates')">
        Templates
      </button>
    </nav>
    <QuerySource
      :default-datasets="defaultDatasets"
      :default-queries="defaultQueries"
      @endpoint="onEndpointSelect"
      @query="onQuerySelect"
    />
    <QueryEditor
      :query-string="defaultQuery"
      @change="q => currentQuery = q"
    />
  </section>
</template>