<script setup lang="ts">
import { defaultSources } from '../logic/sources'

const emit = defineEmits<{
  (e: 'change', value: string): void
}>()

const onSourceChange = (e: Event) => emit('change', (<HTMLInputElement>e.target).value)
</script>

<template>
  <input
    type="url"
    list="known-sources"
    placeholder="https://localhost/sparql"
    @change="onSourceChange"
  >
  <datalist id="known-sources">
    <option
      v-for="{ description, url } of defaultSources"
      :key="url"
      :value="url"
    >
      {{ description }}: {{ url }}
    </option>
  </datalist>
</template>