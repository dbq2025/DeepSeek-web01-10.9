/**
 * 应用级 UI 状态
 * 职责：后台侧边栏折叠状态、主题等跨页面共享的界面状态
 */
import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useAppStore = defineStore(
  'app',
  () => {
    /** 后台侧边栏是否折叠 */
    const sidebarCollapsed = ref(false)
    /** 主题（预留：light / dark） */
    const theme = ref('light')

    /** 切换侧边栏折叠状态 */
    function toggleSidebar() {
      sidebarCollapsed.value = !sidebarCollapsed.value
    }

    /**
     * 设置主题
     * @param {'light'|'dark'} value 主题名
     */
    function setTheme(value) {
      theme.value = value
    }

    return { sidebarCollapsed, theme, toggleSidebar, setTheme }
  },
  { persist: { pick: ['sidebarCollapsed', 'theme'] } }
)
