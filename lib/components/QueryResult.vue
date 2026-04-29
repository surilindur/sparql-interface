<script setup lang="ts">
import type * as RDF from '@rdfjs/types'
import { onMounted, ref, useTemplateRef } from 'vue'
import { inlineVectorImages, updateLinkProperties } from '../visualisation/elements'

const props = defineProps<{
  visualise: (entity: RDF.Term | undefined) => Promise<string>,
  entity: RDF.Term | undefined,
  domParser: DOMParser,
}>()

const emit = defineEmits<{
  (e: 'listen', element: Element, listener: () => void): void,
}>()

const element = useTemplateRef('cell')
const loading = ref<boolean>(false)

async function onViewportInterset(): Promise<void> {
  loading.value = true
  try {
    const output = await props.visualise(props.entity)
    const tree = props.domParser.parseFromString(output, 'text/html')
    await inlineVectorImages(tree.body)
    updateLinkProperties(tree.body)
    element.value!.append(...tree.body.children)
  } catch (error: unknown) {
    const pre = document.createElement('pre')
    pre.classList.add('error')
    pre.textContent = `${error}`
    element.value!.appendChild(pre)
  }
  loading.value = false
}

onMounted(async () => {
  if (element.value) {
    emit('listen', element.value, onViewportInterset)
  }
})
</script>

<template>
  <td
    ref="cell"
    :class="{ loading }"
  />
</template>
