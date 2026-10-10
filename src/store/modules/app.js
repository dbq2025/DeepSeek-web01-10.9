/**
 * 应用级 UI 状态
 * 职责：后台侧边栏折叠等跨页面共享的界面状态
 */
import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useAppStore = defineStore(
  'app',
  () => {
    /** 后台侧边栏是否折叠 */
    const sidebarCollapsed = ref(false)

    /** 切换侧边栏折叠状态 */
    function toggleSidebar() {
      sidebarCollapsed.value = !sidebarCollapsed.value
    }

    return { sidebarCollapsed, toggleSidebar }
  },
  // 侧边栏折叠状态需要跨刷新保留
  { persist: { pick: ['sidebarCollapsed'] } }
)
