<script setup lang="ts">
import type { ITemplate } from '../types/template'
import { saveTemplate } from '../logic/template'
import { ref } from 'vue'

const props = defineProps<{
  template: ITemplate,
}>()

const emit = defineEmits<{
  (e: 'close'): void,
}>()

const matcher = ref<string>(props.template.matcher.source)
const item = ref<string | undefined>(props.template.item)
const page = ref<string | undefined>(props.template.page)

function save(): void {
  saveTemplate({
    matcher: new RegExp(matcher.value),
    item: item.value,
    page: page.value
  })
  emit('close')
}

function empty(): void {
  item.value = undefined
  page.value = undefined
}

async function load(event: Event, target: 'item' | 'page'): Promise<void> {
  const file = (<HTMLInputElement>event.target).files?.item(0)
  if (file) {
    const content = await file.text()
    if (target === 'item') {
      item.value = content
    } else {
      page.value = content
    }
  }
}
</script>

<template>
  <section class="templateeditor">
    <nav>
      <h1>Template editor</h1>
      <button @click="save">
        Save
      </button>
      <button @click="empty">
        Empty
      </button>
      <button @click="() => emit('close')">
        Cancel
      </button>
    </nav>
    <table>
      <tbody>
        <tr>
          <th>Matcher</th>
          <td class="expand">
            <input
              v-model="matcher"
              type="text"
            >
          </td>
        </tr>
        <tr>
          <th>Short template</th>
          <td>
            <pre v-if="item">{{ item }}</pre>
            <input
              v-else
              type="file"
              accept=".ejs"
              @change="(e: Event) => load(e, 'item')"
            >
          </td>
        </tr>
        <tr>
          <th>Detailed template</th>
          <td>
            <pre v-if="page">{{ page }}</pre>
            <input
              v-else
              type="file"
              accept=".ejs"
              @change="(e: Event) => load(e, 'page')"
            >
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>