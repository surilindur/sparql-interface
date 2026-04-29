<script setup lang="ts">
import { onMounted, onUpdated, useTemplateRef } from 'vue'
import { Compartment, EditorState } from '@codemirror/state'
import { githubDark } from '@fsegurai/codemirror-theme-github-dark'
import { githubLight } from '@fsegurai/codemirror-theme-github-light'
import { EditorView, type ViewUpdate, keymap, lineNumbers } from '@codemirror/view'
import { defaultKeymap, indentWithTab } from '@codemirror/commands'
import { sparql } from '../logic/sparql'

const props = defineProps<{
  defaultQuery: string
  updateDelay: number
}>()

const emit = defineEmits<{
  (e: 'update', value: string): void
}>()

let editorView: EditorView | undefined
let updateTimeout: NodeJS.Timeout | undefined

const editorContainer = useTemplateRef('queryeditor')
const editorTheme = new Compartment()

const createEditorState = () => EditorState.create({
  doc: props.defaultQuery,
  extensions: [
    keymap.of([ ...defaultKeymap, indentWithTab ]),
    lineNumbers(),
    sparql(),
    EditorView.updateListener.of((update: ViewUpdate) => {
      if (update.docChanged) {
        clearTimeout(updateTimeout)
        updateTimeout = setTimeout(() => emit('update', update.state.doc.toString()), props.updateDelay)
      }
    }),
    editorTheme.of(window.matchMedia('(prefers-color-scheme: dark)').matches ? githubDark : githubLight)
  ]
})

onMounted(() => {
  editorView = new EditorView({ state: createEditorState(), parent: editorContainer.value! })
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    editorView?.dispatch({
      effects: editorTheme.reconfigure(event.matches ? githubDark : githubLight)
    })
  })
})

onUpdated(() => {
  editorView?.setState(createEditorState())
})
</script>

<template>
  <div ref="queryeditor" />
</template>