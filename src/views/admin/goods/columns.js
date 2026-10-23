/**
 * 商品列表页的表格列与筛选项配置
 * 职责：把纯配置从页面组件里移出，页面只保留数据加载与业务动作
 * 说明：列宽按「1280 视口下 968px 可用宽度」预算（含 48px 多选列，总和 ≈ 940px），
 *      保证 1280 宽不出现横向滚动条，1440 宽时富余空间自动分给「商品」列
 */
import { GOODS_STATUS } from '@/utils/constants'

/** 表格列配置 */
export const GOODS_COLUMNS = [
  { prop: 'cover', label: '图片', type: 'image', width: 64, align: 'center' },
  { prop: 'name', label: '商品', minWidth: 160 },
  { prop: 'categoryName', label: '类型', width: 88 },
  { prop: 'price', label: '价格', type: 'money', width: 96, align: 'right' },
  { prop: 'stock', label: '库存', width: 64, align: 'right' },
  { prop: 'sales', label: '销量', width: 64, align: 'right' },
  { prop: 'status', label: '状态', type: 'tag', tagKind: 'goods', width: 84, align: 'center' },
  { prop: 'createTime', label: '创建时间', type: 'date', width: 136 },
  { label: '操作', type: 'action', width: 140, align: 'center', fixed: 'right' }
]

/**
 * 生成筛选项配置
 * @param {Array<{label:string,value:any}>} categoryOptions 商品类型下拉项
 * @returns {Array<object>} SearchForm 需要的 fields
 */
export function buildGoodsSearchFields(categoryOptions) {
  return [
    { prop: 'name', label: '商品名称' },
    { prop: 'categoryId', label: '商品类型', type: 'select', options: categoryOptions },
    {
      prop: 'status',
      label: '上架状态',
      type: 'select',
      options: [
        { label: '已上架', value: GOODS_STATUS.ON },
        { label: '已下架', value: GOODS_STATUS.OFF }
      ]
    }
  ]
}
