/**
 * 商品模块状态
 * 职责：保存后台商品列表的筛选条件，使「列表 → 新增/编辑 → 返回列表」时筛选条件不丢失
 */
import { reactive } from 'vue'
import { defineStore } from 'pinia'

/**
 * 筛选条件的初始值
 * @returns {{name:string,categoryId:number|string,status:number|string,page:number,pageSize:number}}
 */
function createDefaultQuery() {
  return { name: '', categoryId: '', status: '', page: 1, pageSize: 10 }
}

export const useGoodsStore = defineStore('goods', () => {
  /** 后台商品列表筛选条件（跨页面保留） */
  const adminQuery = reactive(createDefaultQuery())

  /**
   * 覆盖筛选条件
   * @param {Partial<ReturnType<createDefaultQuery>>} query 待合并条件
   * @returns {void}
   */
  function setAdminQuery(query) {
    Object.assign(adminQuery, query)
  }

  /** 重置筛选条件 */
  function resetAdminQuery() {
    Object.assign(adminQuery, createDefaultQuery())
  }

  return { adminQuery, setAdminQuery, resetAdminQuery }
})
