<script setup lang="ts">
import type * as RDF from '@rdfjs/types'
import type { IBindings } from '../logic/types'
import QueryResult from './QueryResult.vue'

defineProps<{
  bindings: IBindings[],
  variables: RDF.Variable[],
  domParser: DOMParser,
  visualise: (entity: RDF.Term | undefined) => Promise<string>,
}>()

const intersectionListeners = new Map<Element, () => void>()
const intersectionObserverOptions: IntersectionObserverInit = { root: null, threshold: 0.5 }
const intersectionObserver = new IntersectionObserver(intersectionObserverCallback, intersectionObserverOptions)

function intersectionObserverCallback(entries: IntersectionObserverEntry[], observer: IntersectionObserver): void {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      observer.unobserve(entry.target)
      const listener = intersectionListeners.get(entry.target)!
      intersectionListeners.delete(entry.target)
      listener()
    }
  }
}

function addIntersectionListener(element: Element, listener: () => void): void {
  if (intersectionListeners.has(element)) {
    throw new Error(`Attempted to register element twice for intersection listener: ${element}`)
  }
  intersectionListeners.set(element, listener)
  intersectionObserver.observe(element)
}
</script>

<template>
  <table>
    <thead>
      <tr>
        <th class="index" /> <!-- index column -->
        <th
          v-for="variable of variables"
          :key="variable.value"
        >
          {{ variable.value }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="(mapping, index) of bindings"
        :key="index"
      >
        <td class="index">
          {{ index }}
        </td>
        <QueryResult
          v-for="variable of variables"
          :key="variable.value"
          :entity="mapping[variable.value]"
          :visualise="visualise"
          :dom-parser="domParser"
          @listen="addIntersectionListener"
        />
      </tr>
    </tbody>
  </table>
</template>