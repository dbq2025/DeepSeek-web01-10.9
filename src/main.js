/**
 * 应用入口
 * 职责：创建应用实例、注册 Pinia / 路由 / Element Plus 图标 / 全局样式
 * 注意：本文件为骨架占位，业务功能由各模块逐步实现
 */
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import App from './App.vue'
import router from './router'
import pinia from './store'
import '@/assets/styles/index.scss'

const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(ElementPlus)

app.mount('#app')
