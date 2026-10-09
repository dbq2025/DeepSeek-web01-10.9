/**
 * 列表通用逻辑（组合函数）
 * 职责：统一「筛选条件 + 分页 + 加载态 + 数据加载」，供后台各列表页复用
 * 用法：
 *   const { loading, list, total, query, load, search, reset, changePage, changeSize } =
 *     useTable(getGoodsListApi, { defaultQuery: { name: '', categoryId: '' } })
 */
import { ref, reactive, onMounted } from 'vue'

/**
 * @param {(params:object)=>Promise<{list:Array,total:number}>} fetchApi 列表接口
 * @param {object} [options] 配置项
 * @param {object} [options.defaultQuery={}] 默认筛选条件（不含 page / pageSize）
 * @param {number} [options.pageSize=10] 每页条数
 * @param {boolean} [options.immediate=true] 是否在 onMounted 时自动加载
 * @returns {object} 列表状态与操作方法
 */
export function useTable(fetchApi, options = {}) {
  const { defaultQuery = {}, pageSize = 10, immediate = true } = options

  const loading = ref(false)
  const list = ref([])
  const total = ref(0)

  /** 查询参数（page / pageSize + 业务筛选条件） */
  const query = reactive({ page: 1, pageSize, ...defaultQuery })

  /**
   * 归一化查询参数：把空字符串转为 undefined，避免 mock 端收到空串
   * @returns {object}
   */
  function normalizeParams() {
    const params = {}
    Object.keys(query).forEach((key) => {
      const value = query[key]
      params[key] = value === '' ? undefined : value
    })
    return params
  }

  /** 按当前条件加载数据 */
  async function load() {
    loading.value = true
    try {
      const data = await fetchApi(normalizeParams())
      list.value = data?.list || []
      total.value = data?.total || 0
    } catch (error) {
      list.value = []
      total.value = 0
    } finally {
      loading.value = false
    }
  }

  /** 条件查询（回到第一页） */
  function search() {
    query.page = 1
    return load()
  }

  /** 重置筛选条件（回到第一页）并重新加载 */
  function reset() {
    Object.assign(query, { page: 1, pageSize, ...defaultQuery })
    return load()
  }

  /**
   * 翻页
   * @param {number} page 目标页码
   */
  function changePage(page) {
    query.page = page
    return load()
  }

  /**
   * 改变每页条数
   * @param {number} size 每页条数
   */
  function changeSize(size) {
    query.pageSize = size
    query.page = 1
    return load()
  }

  if (immediate) {
    onMounted(load)
  }

  return { loading, list, total, query, load, search, reset, changePage, changeSize }
}
