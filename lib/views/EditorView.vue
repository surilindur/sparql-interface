<script setup lang="ts">
import { RouterLink } from 'vue-router'
import QueryEditor from '../components/QueryEditor.vue'
import QuerySource from '../components/QuerySource.vue'
import { datasets as defaultDatasets } from '../defaults/datasets'
import { queries as defaultQueries } from '../defaults/queries'
import { ref } from 'vue'

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
      <RouterLink
        :to="{ path: '/results', query: { endpoint: currentEndpoint, query: currentQuery } }"
        :disabled="!currentQuery || currentQuery.trim().length === 0 || !currentEndpoint || currentEndpoint.trim().length === 0"
      >
        Execute
      </RouterLink>
      <RouterLink to="/templates">
        Templates
      </RouterLink>
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