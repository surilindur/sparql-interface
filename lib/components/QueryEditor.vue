<script setup lang="ts">
import { onMounted, onUpdated, useTemplateRef } from 'vue'
import { Compartment, EditorState } from '@codemirror/state'
import { githubDark } from '@fsegurai/codemirror-theme-github-dark'
import { githubLight } from '@fsegurai/codemirror-theme-github-light'
import { EditorView, type ViewUpdate, keymap, lineNumbers } from '@codemirror/view'
import { defaultKeymap } from '@codemirror/commands'
import { sparql } from '../logic/sparql'

const props = defineProps({
  queryString: { type: String, default: '' },
  emitDelayMilliseconds: { type: Number, default: 100 }
})

const emit = defineEmits<{
  (e: 'change', query: string): void,
  (e: 'error', error: unknown): void
}>()

const editor = useTemplateRef('editor')
const editorTheme = new Compartment()

let editorView: EditorView | undefined
let updateTimeout: NodeJS.Timeout | undefined

function createInitialState(): EditorState {
  return EditorState.create({
    doc: props.queryString,
    extensions: [
      keymap.of(defaultKeymap),
      lineNumbers(),
      sparql(),
      EditorView.updateListener.of((update: ViewUpdate) => {
        if (update.docChanged) {
          clearTimeout(updateTimeout)
          updateTimeout = setTimeout(() => {
            try {
              emit('change', update.state.doc.toString())
            } catch (error) {
              emit('error', error)
            }
          }, props.emitDelayMilliseconds)
        }
      }),
      editorTheme.of(window.matchMedia('(prefers-color-scheme: dark)').matches ? githubDark : githubLight)
    ]
  })
}

onMounted(() => {
  editorView = new EditorView({ state: createInitialState(), parent: editor.value! })

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    editorView!.dispatch({
      effects: editorTheme.reconfigure(event.matches ? githubDark : githubLight)
    })
  })
})

onUpdated(() => {
  editorView?.setState(createInitialState())
})
</script>

<template>
  <section
    ref="editor"
    class="query-editor"
  />
</template>
