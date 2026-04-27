import { createRouter, createWebHistory } from 'vue-router'
import { createApp } from 'vue'

import App from './App.vue'
import DetailsView from './views/DetailsView.vue'
import EditorView from './views/EditorView.vue'
import ResultView from './views/ResultView.vue'

const router = createRouter({
  routes: [
    { path: '/', component: EditorView },
    { path: '/details', component: DetailsView },
    { path: '/results', component: ResultView }
  ],
  history: createWebHistory()
})

const app = createApp(App).use(router)

export { app as SPARQLInterface }
