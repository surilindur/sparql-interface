<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { IQuery } from '../types/query'
import type { IDataset } from '../types/dataset'
import { collectExampleQueriesFromEndpoint } from '../logic/query'

const props = defineProps<{
  defaultQueries: IQuery[],
  defaultDatasets: IDataset[],
}>()

const emit = defineEmits<{
  (e: 'endpoint', endpoint: string): void,
  (e: 'query', query: string | undefined): void,
  (e: 'error', error: unknown): void,
}>()

const compareQueries = (a: IQuery, b: IQuery) => a.comment < b.comment ? -1 : 1

const currentEndpoint = ref<string>('')
const currentQueries = ref<IQuery[]>([ ...props.defaultQueries ].sort(compareQueries))

onMounted(() => {
  emit('query', currentQueries.value.at(0)?.content)
})

function onQuerySelect(event: Event): void {
  try {
    const target = <HTMLSelectElement>event.target
    const index = Number.parseInt(target.value)
    emit('query', currentQueries.value.at(index)?.content)
  } catch (error: unknown) {
    emit('error', error)
  }
}

async function onEndpointChange(): Promise<void> {
  try {
    const url = new URL(currentEndpoint.value!)
    currentQueries.value = [
      ...props.defaultQueries,
      ...await collectExampleQueriesFromEndpoint(url.href)
    ].sort(compareQueries)
    emit('query', currentQueries.value.at(0)?.content)
    emit('endpoint', currentEndpoint.value)
  } catch (error: unknown) {
    emit('error', error)
  }
}
</script>

<template>
  <input
    v-model="currentEndpoint"
    type="url"
    list="known-endpoints"
    placeholder="https://localhost/sparql"
    @change="onEndpointChange"
  >
  <datalist id="known-endpoints">
    <option
      v-for="{ description, endpoint } of defaultDatasets"
      :key="endpoint"
      :value="endpoint"
    >
      {{ description }} @{{ endpoint }}
    </option>
  </datalist>
  <select
    :disabled="currentQueries.length === 0"
    @change="onQuerySelect"
  >
    <option
      v-for="(query, index) of currentQueries"
      :key="index"
      :value="index"
    >
      {{ query.comment }}
    </option>
  </select>
</template>