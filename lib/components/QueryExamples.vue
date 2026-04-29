<script setup lang="ts">
import { ref, onUpdated } from 'vue'
import type { IQueryExample } from '../logic/types'
import { collectQueryExamples } from '../logic/sources'

const props = defineProps<{
  source: string
}>()

const emit = defineEmits<{
  (e: 'select', query: string): void
}>()

let currentSource: string | undefined

const currentQueries = ref<IQueryExample[]>()
const compareQueries = (a: IQueryExample, b: IQueryExample) => a.comment < b.comment ? -1 : 1
const onQuerySelect = (e: Event) => emit('select', (<HTMLSelectElement>e.target).value)

onUpdated(async() => {
  if (props.source !== currentSource && URL.canParse(props.source)) {
    currentSource = props.source
    currentQueries.value = await collectQueryExamples(props.source)
    currentQueries.value.sort(compareQueries)
    if (currentQueries.value.length > 0) {
      emit('select', currentQueries.value[0].content)
    }
  }
})
</script>

<template>
  <select
    :disabled="!currentQueries"
    @change="onQuerySelect"
  >
    <option
      v-for="{ url, content, comment } of currentQueries"
      :key="url"
      :value="content"
    >
      {{ comment }}
    </option>
  </select>
</template>