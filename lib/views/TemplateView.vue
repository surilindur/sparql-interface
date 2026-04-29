<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { ITermTemplateCollection } from '../logic/types'
import { disableTemplateCollection, enableTemplateCollection, listTemplateCollections, removeTemplateCollection } from '../logic/templates'

const collections = ref<ITermTemplateCollection[]>([])
const newCollection = ref<string>()

onMounted(async() => {
  collections.value.push(...await listTemplateCollections())
})

async function onCollectionEnable(url: string) {
  collections.value = await enableTemplateCollection(url)
}

async function onCollectionDisable(url: string) {
  collections.value = await disableTemplateCollection(url)
}

async function onCollectionRemove(url: string) {
  collections.value = await removeTemplateCollection(url)
}
</script>

<template>
  <nav>
    <h1>Templates</h1>
  </nav>
  <table>
    <thead>
      <tr>
        <th class="index" /> <!-- template index -->
        <th>Name</th>
        <th>Description</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="({ url, name, description, enabled }, index) of collections"
        :key="url"
      >
        <td class="index">
          {{ index }}
        </td>
        <td>{{ name }}</td>
        <td>{{ description }}</td>
        <td>
          <span class="row">
            <button
              class="button"
              @click="() => enabled ? onCollectionDisable(url) : onCollectionEnable(url)"
            >{{ enabled ? 'Disable' : 'Enable' }}</button>
            <button
              class="button"
              @click="() => onCollectionRemove(url)"
            >Remove</button>
          </span>
        </td>
      </tr>
      <tr>
        <td />
        <td colspan="2">
          <input
            v-model="newCollection"
            type="url"
          >
        </td>
        <td>
          <button
            class="button"
            @click="() => onCollectionEnable(newCollection!)"
          >
            Add
          </button>
        </td>
      </tr>
    </tbody>
  </table>
</template>
