/**
 * 订单模块状态
 * 职责：暂存「订单确认页」需要的商品明细与收货信息
 * 说明：购物车 → 订单确认 → 提交订单 之间通过本 store 传递数据，不持久化（刷新回到购物车）
 */
import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useOrderStore = defineStore('order', () => {
  /** @type {import('vue').Ref<Array<{goodsId:number,goodsName:string,price:number,count:number,cover:string}>>} */
  const confirmItems = ref([])
  /** 收货信息 */
  const address = ref({ name: '', phone: '', detail: '' })
  /** 下单来源：cart（购物车结算） / buyNow（立即购买） */
  const source = ref('cart')

  /**
   * 设置待确认的商品明细
   * @param {Array} items 商品明细
   * @param {'cart'|'buyNow'} [from='cart'] 来源
   * @returns {void}
   */
  function setConfirmItems(items, from = 'cart') {
    confirmItems.value = items
    source.value = from
  }

  /**
   * 设置收货信息
   * @param {{name:string,phone:string,detail:string}} value 收货信息
   * @returns {void}
   */
  function setAddress(value) {
    address.value = { ...address.value, ...value }
  }

  /** 清空确认数据（下单成功后调用） */
  function clear() {
    confirmItems.value = []
    source.value = 'cart'
  }

  return { confirmItems, address, source, setConfirmItems, setAddress, clear }
})
