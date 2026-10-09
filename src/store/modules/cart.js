/**
 * 购物车状态
 * 说明：本项目购物车保存在前端（Pinia + 持久化），下单时把明细提交给订单接口。
 *      未登录用户也可加购，登录后仍保留本地购物车。
 */
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useCartStore = defineStore(
  'cart',
  () => {
    /** @type {import('vue').Ref<Array<{goodsId:number,goodsName:string,price:number,count:number,cover:string,checked:boolean}>>} */
    const items = ref([])

    /** 购物车商品总件数（用于顶部角标） */
    const totalCount = computed(() => items.value.reduce((sum, it) => sum + it.count, 0))

    /** 已勾选商品的总金额 */
    const totalPrice = computed(() =>
      items.value.filter((it) => it.checked).reduce((sum, it) => sum + it.price * it.count, 0)
    )

    /** 已勾选的商品明细（用于下单） */
    const checkedItems = computed(() => items.value.filter((it) => it.checked))

    /** 是否全选 */
    const allChecked = computed(
      () => items.value.length > 0 && items.value.every((it) => it.checked)
    )

    /**
     * 加入购物车（已存在则累加数量）
     * @param {{id:number,name:string,price:number,cover?:string}} goods 商品
     * @param {number} [count=1] 数量
     * @returns {void}
     */
    function addItem(goods, count = 1) {
      const exist = items.value.find((it) => it.goodsId === goods.id)
      if (exist) {
        exist.count += count
      } else {
        items.value.push({
          goodsId: goods.id,
          goodsName: goods.name,
          price: goods.price,
          count,
          cover: goods.cover || '',
          checked: true
        })
      }
    }

    /**
     * 修改数量（数量减到 0 时移除该商品）
     * @param {number} goodsId 商品 id
     * @param {number} count 新数量
     * @returns {void}
     */
    function updateCount(goodsId, count) {
      const target = items.value.find((it) => it.goodsId === goodsId)
      if (!target) return
      if (count <= 0) {
        removeItem(goodsId)
        return
      }
      target.count = count
    }

    /**
     * 移除商品
     * @param {number} goodsId 商品 id
     * @returns {void}
     */
    function removeItem(goodsId) {
      items.value = items.value.filter((it) => it.goodsId !== goodsId)
    }

    /**
     * 切换单个商品勾选状态
     * @param {number} goodsId 商品 id
     * @param {boolean} checked 目标状态
     * @returns {void}
     */
    function toggleChecked(goodsId, checked) {
      const target = items.value.find((it) => it.goodsId === goodsId)
      if (target) target.checked = checked
    }

    /**
     * 全选 / 取消全选
     * @param {boolean} checked 目标状态
     * @returns {void}
     */
    function toggleAll(checked) {
      items.value.forEach((it) => {
        it.checked = checked
      })
    }

    /** 清空购物车 */
    function clear() {
      items.value = []
    }

    /** 移除已下单的商品 */
    function removeChecked() {
      items.value = items.value.filter((it) => !it.checked)
    }

    return {
      items,
      totalCount,
      totalPrice,
      checkedItems,
      allChecked,
      addItem,
      updateCount,
      removeItem,
      toggleChecked,
      toggleAll,
      clear,
      removeChecked
    }
  },
  // 游客态也保留购物车，故整体持久化
  { persist: true }
)
