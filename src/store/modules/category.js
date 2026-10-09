/**
 * 商品类型缓存
 * 职责：类型列表在首页导航、搜索筛选、后台商品表单中反复使用，做一次拉取 + 缓存
 */
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { getAllCategoriesApi } from '@/api/admin/category'

export const useCategoryStore = defineStore('category', () => {
  /** @type {import('vue').Ref<Array<{id:number,name:string}>>} */
  const list = ref([])
  /** 是否已加载过 */
  const loaded = ref(false)

  /** 下拉选项格式 */
  const options = computed(() => list.value.map((c) => ({ label: c.name, value: c.id })))

  /**
   * 拉取全部类型（默认走缓存，force 可强制刷新）
   * @param {boolean} [force=false] 是否强制刷新
   * @returns {Promise<Array>}
   */
  async function fetchAll(force = false) {
    if (loaded.value && !force) return list.value
    list.value = await getAllCategoriesApi()
    loaded.value = true
    return list.value
  }

  /**
   * 根据 id 取类型名
   * @param {number} id 类型 id
   * @returns {string}
   */
  function getNameById(id) {
    const hit = list.value.find((c) => c.id === Number(id))
    return hit ? hit.name : '未分类'
  }

  /** 重置缓存（类型增删改后调用） */
  function reset() {
    loaded.value = false
  }

  return { list, loaded, options, fetchAll, getNameById, reset }
})
