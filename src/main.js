/**
 * 应用入口
 * 职责：创建应用实例、注册 Pinia / 路由 / Element Plus / 全局样式
 */
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'

import App from './App.vue'
import router from './router'
import pinia from './store'
import '@/assets/styles/index.scss'

const app = createApp(App)

app.use(pinia)
app.use(router)
// 必须显式指定中文语言包：Element Plus 默认是英文，
// 否则分页「Go to」、日期选择器、上传组件等全部显示英文
app.use(ElementPlus, { locale: zhCn })

app.mount('#app')
