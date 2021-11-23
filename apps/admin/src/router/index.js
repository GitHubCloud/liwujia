import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/banner',
    name: 'banner',
    component: () => import('../views/banner/index.vue')
  },
  {
    path: '/article/create',
    name: 'article-create',
    component: () => import('../views/article/create.vue')
  },
  {
    path: '/article/list',
    name: 'article-list',
    component: () => import('../views/article/list.vue')
  },
  {
    path: '/feedback',
    name: 'feedback',
    component: () => import('../views/feedback/index.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/Error.vue')
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
