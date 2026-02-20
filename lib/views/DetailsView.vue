<script setup lang="ts">
import type * as RDF from '@rdfjs/types'
import { onMounted, ref, useTemplateRef } from 'vue'
import { renderHierarchy } from '../logic/hierarchy'
import { renderSpectrum } from '../logic/spectrum'
import { inlineVectorImages, updateLinkProperties } from '../logic/elements'
import { invocationCount, queryCount, dataFactory } from '../logic/query'

const props = defineProps<{
  entity: RDF.Term,
  domParser: DOMParser,
  visualise: (entity: RDF.Term) => Promise<string>,
}>()

const emit = defineEmits<{
  (e: 'close'): void,
  (e: 'inspect', entity: RDF.Term): void,
}>()

const container = useTemplateRef('container')
const loading = ref<boolean>(false)

function getElementWidth(element: Element): number {
  const style = getComputedStyle(element)
  const width = element.clientWidth - Number.parseFloat(style.paddingLeft) - Number.parseFloat(style.paddingRight)
  return width
}

async function visualiseCustomElements(): Promise<void> {
  // Class hierarchies
  for (const element of document.getElementsByClassName('hierarchy')) {
    try {
      const data = JSON.parse(element.innerHTML)
      const width = getElementWidth(element)
      const svg = renderHierarchy(data, width)
      element.innerHTML = ''
      element.appendChild(svg)
    } catch (error: unknown) {
      element.innerHTML = `<pre class="error">${error}</pre>`
    }
  }
  // Mass spectrum plots
  for (const element of document.getElementsByClassName('spectrum')) {
    try {
      // Example: 'https://idsm.elixir-czech.cz/chemweb/isdb/compound/spectrum?id=WBNWCFFNNHMAIO-P'
      const url = new URL((<HTMLElement>element).dataset.source!)
      const response = await fetch(url, { headers: { accept: 'application/json' } })
      const data = await response.json()
      const width = getElementWidth(element)
      const chart = renderSpectrum(data, width)
      element.appendChild(chart)
    } catch (error: unknown) {
      element.innerHTML = `<pre class="error">${error}</pre>`
    }
  }
  await inlineVectorImages(container.value!)
  updateLinkProperties(container.value!)
  for (const link of container.value!.getElementsByTagName('a')) {
    const href = link.getAttribute('href')
    if (href) {
      link.addEventListener('click', (event: MouseEvent) => {
        event.preventDefault()
        const e = dataFactory.namedNode(href)
        console.log('INSPECT', e)
        emit('inspect', e)
      })
    }
  }
}

async function visualiseResult(): Promise<void> {
  loading.value = true
  try {
    const output = await props.visualise(props.entity)
    const tree = props.domParser.parseFromString(output, 'text/html')
    container.value!.append(...tree.body.children)
    setTimeout(visualiseCustomElements)
  } catch (error: unknown) {
    const pre = document.createElement('pre')
    pre.classList.add('error')
    pre.textContent = `${error}`
    container.value!.appendChild(pre)
  }
  loading.value = false
}

onMounted(visualiseResult)
</script>

<template>
  <section
    ref="container"
    class="sparqldetails"
  >
    <nav>
      <h1>Result details</h1>
      <small>{{ invocationCount }} / {{ queryCount }} queries</small>
      <button @click="() => emit('close')">
        Close
      </button>
    </nav>
    <span
      v-if="loading"
      class="loading"
    />
  </section>
</template>
