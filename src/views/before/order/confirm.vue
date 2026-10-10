<!--
  订单确认页
  职责：填写收货信息 + 核对商品明细 + 提交订单
  说明：商品明细来自购物车中「已勾选」的条目；下单成功后移除这些条目并跳转订单详情
-->
<template>
  <div class="confirm">
    <h2 class="confirm__title">确认订单</h2>

    <EmptyState v-if="!cartStore.checkedItems.length" description="没有待结算的商品">
      <el-button type="primary" @click="router.push('/cart')">返回购物车</el-button>
    </EmptyState>

    <template v-else>
      <section class="confirm__panel">
        <h3 class="confirm__subtitle">收货信息</h3>
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="90px"
          class="confirm__form"
        >
          <el-form-item label="收货人" prop="name">
            <el-input v-model="form.name" placeholder="请输入收货人姓名" maxlength="20" />
          </el-form-item>
          <el-form-item label="手机号" prop="phone">
            <el-input v-model="form.phone" placeholder="请输入手机号" maxlength="11" />
          </el-form-item>
          <el-form-item label="收货地址" prop="detail">
            <el-input
              v-model="form.detail"
              type="textarea"
              :rows="3"
              maxlength="120"
              show-word-limit
              placeholder="请输入详细收货地址（省 / 市 / 区 + 详细地址）"
            />
          </el-form-item>
        </el-form>
      </section>

      <section class="confirm__panel">
        <h3 class="confirm__subtitle">商品明细</h3>
        <OrderGoodsList :items="cartStore.checkedItems" />
      </section>

      <div class="confirm__bar">
        <span class="confirm__bar-tip">
          共 <b>{{ totalCount }}</b> 件商品，应付金额
        </span>
        <span class="confirm__bar-total">{{ formatMoney(cartStore.totalPrice) }}</span>
        <el-button type="danger" size="large" :loading="submitting" @click="onSubmit">
          提交订单
        </el-button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import EmptyState from '@/components/common/EmptyState.vue'
import OrderGoodsList from '@/components/before/OrderGoodsList.vue'
import { createOrderApi } from '@/api/before/order'
import { useCartStore } from '@/store/modules/cart'
import { useUserStore } from '@/store/modules/user'
import { PHONE_RULE, required } from '@/utils/validate'
import { formatMoney } from '@/utils/format'

const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()

const formRef = ref(null)
const submitting = ref(false)

/** 收货信息表单（默认用当前用户资料预填） */
const form = reactive({ name: '', phone: '', detail: '' })

const rules = {
  name: [required('收货人姓名')],
  phone: [required('手机号'), PHONE_RULE],
  detail: [required('收货地址')]
}

/** 待结算商品总件数 */
const totalCount = computed(() => cartStore.checkedItems.reduce((sum, it) => sum + it.count, 0))

/** 提交订单：校验通过后调用下单接口 */
async function onSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return // 校验未通过
  }

  submitting.value = true
  try {
    const order = await createOrderApi({
      items: cartStore.checkedItems.map((it) => ({ goodsId: it.goodsId, count: it.count })),
      address: { ...form }
    })
    cartStore.removeChecked()
    ElMessage.success('下单成功')
    router.replace(`/order/detail/${order.id}`)
  } catch (error) {
    // 失败提示由 request.js 统一处理（如库存不足）
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  const profile = userStore.profile || {}
  form.name = profile.nickname || ''
  form.phone = profile.phone || ''
})
</script>

<style scoped lang="scss">
.confirm {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__title {
    margin: 0;
    padding-left: 10px;
    border-left: 3px solid $color-primary;
    font-size: 17px;
    font-weight: 600;
    line-height: 1.2;
    color: var(--el-text-color-primary);
  }

  &__panel {
    @include card-surface;

    padding: 18px 20px 4px;
  }

  &__subtitle {
    margin: 0 0 16px;
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__form {
    max-width: 620px;
    padding-bottom: 10px;
  }

  &__bar {
    @include card-surface;

    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 16px;
    padding: 14px 20px;
  }

  &__bar-tip {
    color: var(--el-text-color-regular);
    font-size: 13px;

    b {
      color: var(--el-text-color-primary);
    }
  }

  &__bar-total {
    color: $color-price;
    font-size: 24px;
    font-weight: 700;
  }
}
</style>
