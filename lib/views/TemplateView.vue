<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { ITemplate } from '../types/template'
import { resetTemplate, listTemplates, resetAllTemplates } from '../logic/template'

import TemplateEditor from '../components/TemplateEditor.vue'
import TemplateList from '../components/TemplateList.vue'

const emit = defineEmits<{
  (e: 'close'): void,
}>()

const templates = ref<ITemplate[]>([])
const editing = ref<ITemplate>()

function onEditorClosed() {
  editing.value = undefined
  templates.value = listTemplates()
}

function onTemplateReset(template: ITemplate): void {
  editing.value = undefined
  templates.value = resetTemplate(template)
}

function onAllTemplateReset(): void {
  templates.value = resetAllTemplates()
}

function onTemplateEdit(template: ITemplate): void {
  editing.value = template
}

onMounted(onEditorClosed)
</script>

<template>
  <TemplateEditor
    v-if="editing"
    :template="editing"
    @close="onEditorClosed"
  />
  <TemplateList
    v-else
    :templates="templates"
    @reset="onTemplateReset"
    @edit="onTemplateEdit"
    @resetall="onAllTemplateReset"
    @close="() => emit('close')"
  />
</template>