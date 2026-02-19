<script setup lang="ts">
import type { ITemplate } from '../types/template'

defineProps<{
  templates: ITemplate[],
}>()

const emit = defineEmits<{
  (e: 'close'): void,
  (e: 'edit', template: ITemplate): void,
  (e: 'reset', template: ITemplate): void,
  (e: 'resetall'): void,
}>()
</script>

<template>
  <section class="templatelist">
    <nav>
      <h1>Templates</h1>
      <button @click="() => emit('edit', { matcher: /.+/ })">
        Add
      </button>
      <button @click="() => emit('resetall')">
        Reset all
      </button>
      <button @click="() => emit('close')">
        Close
      </button>
    </nav>
    <table>
      <thead>
        <tr>
          <th class="index" /> <!-- template index -->
          <th>Entity matching expression</th>
          <th>Short inline template</th>
          <th>Detailed template</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(template, index) of templates"
          :key="index"
        >
          <td class="index">
            {{ index }}
          </td>
          <td>
            <code>{{ template.matcher.source }}</code>
          </td>
          <td>{{ template.item !== undefined ? `${template.item.length} characters` : '' }}</td>
          <td>{{ template.page !== undefined ? `${template.page.length} characters` : '' }}</td>
          <td>
            <span class="row">
              <button @click="() => emit('edit', template)">Edit</button>
              <button @click="() => emit('reset', template)">Reset</button>
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
