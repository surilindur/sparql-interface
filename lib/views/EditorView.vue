<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import QuerySource from '../components/QuerySource.vue'
import QueryExamples from '../components/QueryExamples.vue'
import QueryEditor from '../components/QueryEditor.vue'

const queryString = ref<string>('')
const queryExample = ref<string>('')
const querySource = ref<string>('')

function onExampleSelect(value: string) {
  queryExample.value = value
  queryString.value = value
}

function onQueryUpdate(value: string) {
  queryString.value = value
}
</script>

<template>
  <nav>
    <h1>SPARQL Editor</h1>
    <RouterLink
      class="button"
      :to="{ path: '/results', query: { endpoint: querySource, query: queryString } }"
      :disabled="!queryString.trim() || !querySource.trim()"
    >
      Execute
    </RouterLink>
    <RouterLink
      class="button"
      to="/templates"
    >
      Templates
    </RouterLink>
  </nav>
  <QuerySource @change="source => querySource = source" />
  <QueryExamples
    :source="querySource"
    @select="onExampleSelect"
  />
  <QueryEditor
    :default-query="queryExample"
    :update-delay="100"
    @update="onQueryUpdate"
  />
</template>
