<script setup lang="ts">
import type * as RDF from '@rdfjs/types'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { IBindings } from '../logic/types'
import { visualiseTerm } from '../logic/templates'
import { dataFactory, queryEngine, getInScopeVariables, invocationCount, queryCount } from '../logic/query'
import QueryResultTable from '../components/QueryResultTable.vue'
import { bindingsToRecord } from '../logic/utils'

const router = useRouter()
const domParser = new DOMParser()
const locationQuery = new URL(window.location.href)
const sparqlEndpoint = locationQuery.searchParams.get('endpoint')!
const sparqlQuery = locationQuery.searchParams.get('query')!

const resultVariables = ref<RDF.Variable[]>([])
const resultBindings = ref<IBindings[]>([])
const queryError = ref<unknown>()

async function executeAsk(): Promise<void> {
  resultVariables.value = [ dataFactory.variable('ask') ]
  invocationCount.value++
  queryCount.value++
  const result = await queryEngine.queryBoolean(sparqlQuery, { sources: [ sparqlEndpoint ] })
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
    queryEngine.queryQuads(sparqlQuery, { sources: [ sparqlEndpoint ] }).then(quadStream => {
      quadStream
        .on('data', quad => resultBindings.value.push(quad))
        .on('error', reject)
        .on('end', resolve)
    }).catch(reject)
  })
}

async function executeSelect(): Promise<void> {
  resultVariables.value = getInScopeVariables(sparqlQuery)
  resultBindings.value = []
  await new Promise<void>((resolve, reject) => {
    invocationCount.value++
    queryCount.value++
    queryEngine.queryBindings(sparqlQuery, { sources: [ sparqlEndpoint ] }).then(bindingsStream => {
      bindingsStream
        .on('data', (bindings: RDF.Bindings) => resultBindings.value.push(bindingsToRecord(bindings)))
        .on('error', reject)
        .on('end', resolve)
    }).catch(reject)
  })
}

async function executeQuery(): Promise<void> {
  invocationCount.value = 0
  queryCount.value = 0
  try {
    if (sparqlQuery.includes('ASK')) {
      await executeAsk()
    } else if (sparqlQuery.includes('CONSTRUCT')) {
      await executeConstruct()
    } else if (sparqlQuery.includes('SELECT')) {
      await executeSelect()
    } else {
      throw new Error(`Unknown type of query: ${sparqlQuery}`)
    }
  } catch (error: unknown) {
    queryError.value = error
  }
}

onMounted(executeQuery)
</script>

<template>
  <nav>
    <h1>Query results</h1>
    <small>{{ resultBindings.length }} rows, {{ invocationCount }} / {{ queryCount }} queries</small>
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
    :visualise="(e) => visualiseTerm(e, sparqlEndpoint)"
    :dom-parser="domParser"
    @inspect="(term: RDF.Term) => router.push({ path: '/details', query: { term: term.value, endpoint: sparqlEndpoint } })"
  />
</template>