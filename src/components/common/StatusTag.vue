<!--
  通用状态标签
  职责：把「订单状态」「商品上下架状态」统一映射为文案 + Element Plus tag 类型，
       避免各页面重复书写 status → text / type 的映射表
  用法：
    <StatusTag kind="order" :status="row.status" />
    <StatusTag kind="goods" :status="row.status" />
-->
<template>
  <el-tag :type="tagType" :effect="effect" size="small">{{ text }}</el-tag>
</template>

<script setup>
import { computed } from 'vue'
import { GOODS_STATUS } from '@/utils/constants'
import { formatGoodsStatus, formatOrderStatus, orderStatusTagType } from '@/utils/format'

const props = defineProps({
  /** 状态类别：order = 订单状态，goods = 商品上下架 @type {'order'|'goods'} */
  kind: {
    type: String,
    default: 'order',
    validator: (value) => ['order', 'goods'].includes(value)
  },
  /** 状态码 @type {number} */
  status: { type: Number, default: 0 },
  /** 标签风格 @type {'dark'|'light'|'plain'} */
  effect: { type: String, default: 'light' }
})

/** 商品上下架状态 → Element Plus tag 类型 */
const GOODS_TAG_TYPE = {
  [GOODS_STATUS.ON]: 'success',
  [GOODS_STATUS.OFF]: 'info'
}

/** 展示文案 */
const text = computed(() =>
  props.kind === 'goods' ? formatGoodsStatus(props.status) : formatOrderStatus(props.status)
)

/** Element Plus tag 类型 */
const tagType = computed(() =>
  props.kind === 'goods'
    ? GOODS_TAG_TYPE[props.status] || 'info'
    : orderStatusTagType(props.status)
)
</script>
