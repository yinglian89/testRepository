import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    // 重定向
    path: '/',
    redirect: '/play'
  },
  {
    path: '/play',
    name: 'Play',
    component: () => import( '../views/play/index.vue')
  }
  // {
  //   path: '/about',
  //   name: 'About',
  //   // route level code-splitting
  //   // this generates a separate chunk (about.[hash].js) for this route
  //   // which is lazy-loaded when the route is visited.
  //   component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
  // }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
