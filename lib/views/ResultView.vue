<script setup lang="ts">
import type * as RDF from '@rdfjs/types'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { IBindings } from 'fetch-sparql-endpoint'
import { visualiseItem } from '../logic/visualisation'
import { dataFactory, endpointFetcher, getInScopeVariables, invocationCount, queryCount } from '../logic/query'
import QueryResultTable from '../components/QueryResultTable.vue'

const router = useRouter()
const domParser = new DOMParser()
const locationQuery = new URL(window.location.href)
const sparqlEndpoint = locationQuery.searchParams.get('endpoint')!
const sparqlQuery = locationQuery.searchParams.get('query')!

let resultStream: _Readable | undefined

const resultVariables = ref<RDF.Variable[]>([])
const resultBindings = ref<IBindings[]>([])
const queryError = ref<unknown>()

async function executeAsk(): Promise<void> {
  resultVariables.value = [ dataFactory.variable('ask') ]
  invocationCount.value++
  queryCount.value++
  const result = await endpointFetcher.fetchAsk(sparqlEndpoint, sparqlQuery)
  resultBindings.value = [
    {
      ask: dataFactory.literal(
        result ? 'true' : 'false',
        dataFactory.namedNode('http://www.w3.org/2001/XMLSchema#boolean')
      )
    }
  ]
}

async function executeConstruct(): Promise<void> {
  resultVariables.value = [
    dataFactory.variable('subject'),
    dataFactory.variable('predicate'),
    dataFactory.variable('object'),
    dataFactory.variable('graph')
  ]
  resultBindings.value = []
  await new Promise<void>((resolve, reject) => {
    invocationCount.value++
    queryCount.value++
    endpointFetcher.fetchTriples(sparqlEndpoint, sparqlQuery).then(quadStream => {
      resultStream = quadStream
      quadStream
        .on('data', quad => resultBindings.value.push(quad))
        .on('error', reject)
        .on('end', resolve)
    }).catch(reject)
  })
  resultStream = undefined
}

async function executeSelect(): Promise<void> {
  resultVariables.value = getInScopeVariables(sparqlQuery)
  resultBindings.value = []
  await new Promise<void>((resolve, reject) => {
    invocationCount.value++
    queryCount.value++
    endpointFetcher.fetchBindings(sparqlEndpoint, sparqlQuery).then(bindingsStream => {
      bindingsStream
        .on('data', bindings => resultBindings.value.push(bindings))
        .on('error', reject)
        .on('end', resolve)
    }).catch(reject)
  })
  resultStream = undefined
}

async function executeQuery(): Promise<void> {
  invocationCount.value = 0
  queryCount.value = 0
  try {
    switch (endpointFetcher.getQueryType(sparqlQuery)) {
      case 'ASK':
        await executeAsk()
        break
      case 'CONSTRUCT':
        await executeConstruct()
        break
      case 'SELECT':
        await executeSelect()
        break
      default:
        throw new Error(`Unknown type of query: ${sparqlQuery}`)
    }
  } catch (error: unknown) {
    queryError.value = error
  }
}

function onClose(): void {
  if (resultStream) {
    resultStream.emit('end')
  }
  router.push({ path: '/' })
}

onMounted(executeQuery)
</script>

<template>
  <section class="sparqlresults">
    <nav>
      <h1>Query results</h1>
      <small>{{ resultBindings.length }} rows, {{ invocationCount }} / {{ queryCount }} queries</small>
      <button @click="onClose">
        Close
      </button>
    </nav>
    <pre
      v-if="queryError"
      class="error"
    >{{ queryError }}</pre>
    <span
      v-else-if="resultBindings.length < 1"
      class="loading"
    />
    <QueryResultTable
      v-else
      :bindings="resultBindings"
      :variables="resultVariables"
      :visualise="(e) => visualiseItem(e, sparqlEndpoint)"
      :dom-parser="domParser"
      @inspect="(term: RDF.Term) => router.push({ path: '/details', query: { term: term.value, endpoint: sparqlEndpoint } })"
    />
  </section>
</template>