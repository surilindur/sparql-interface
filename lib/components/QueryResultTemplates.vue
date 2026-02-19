<script setup lang="ts">
import type { ITemplate } from '../types/template'

defineProps<{
  defaultTemplates: ITemplate[],
}>()
</script>

<template>
  <section class="template-manager">
    <table>
      <thead>
        <tr>
          <th>Matcher</th>
          <th>Short version</th>
          <th>Long version</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="({ matcher, item, page }, index) of defaultTemplates"
          :key="index"
        >
          <td>
            <pre>{{ matcher }}</pre>
          </td>
          <td>
            <details v-if="item">
              <summary>{{ item.length }} characters</summary>
              <pre>{{ item }}</pre>
            </details>
          </td>
          <td>
            <details v-if="page">
              <summary>{{ page.length }} characters</summary>
              <pre>{{ page }}</pre>
            </details>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
