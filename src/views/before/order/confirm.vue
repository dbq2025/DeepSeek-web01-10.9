<!--
  订单确认页
  职责：填写收货信息 + 核对商品明细 + 提交订单
  说明：商品明细来自购物车中「已勾选」的条目；下单成功后移除这些条目并跳转订单详情
-->
<template>
  <div class="confirm">
    <PageHeader
      title="确认订单"
      description="核对收货信息与商品明细后提交，提交后可在「我的订单」跟踪状态"
    />

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
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import EmptyState from '@/components/common/EmptyState.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import OrderGoodsList from '@/components/before/OrderGoodsList.vue'
import { createOrderApi } from '@/api/before/order'
import { getUserProfileApi } from '@/api/before/auth'
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

/**
 * 用当前用户资料预填收货信息
 * 说明：只填充空字段，不覆盖用户已输入的内容
 * @param {object|null} profile 用户资料
 * @returns {void}
 */
function fillFromProfile(profile) {
  if (!profile) return
  form.name = form.name || profile.nickname || ''
  form.phone = form.phone || profile.phone || ''
}

// 登录态只持久化 token / role，刷新后 profile 为空；而父布局补拉资料是异步的，
// 且子组件的 onMounted 早于父组件执行 —— 只在 onMounted 里读一次会导致硬刷新时
// 收货人 / 手机号必定为空。故用 watch + immediate 兜住「资料迟到」，并在本页自行补拉，
// 使本页不依赖父布局的副作用。
watch(() => userStore.profile, fillFromProfile, { immediate: true })

onMounted(async () => {
  if (!userStore.isLogin || userStore.profile) return
  try {
    userStore.updateProfile(await getUserProfileApi())
  } catch (error) {
    // 登录态异常由 request.js 统一处理
  }
})
</script>

<style scoped lang="scss">
.confirm {
  display: flex;
  flex-direction: column;
  gap: $space-4;

  &__panel {
    @include card-surface($space-5);

    padding-bottom: $space-2;
  }

  &__subtitle {
    margin: 0 0 $space-4;
    color: var(--app-text-1);
    font-size: 15px;
    font-weight: 600;
  }

  &__form {
    max-width: 620px;
  }

  // 底部提交条：浅底卡片，避免与两条明细卡混淆
  &__bar {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: $space-4;
    padding: $space-4 $space-5;
    background: var(--app-bg-card);
    border-radius: var(--app-radius-card);
    box-shadow: var(--app-shadow-card);
  }

  &__bar-tip {
    color: var(--app-text-3);
    font-size: $font-13;

    b {
      color: var(--app-text-1);
      font-variant-numeric: tabular-nums;
    }
  }

  &__bar-total {
    color: var(--app-color-price);
    font-size: 24px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
  }
}

@include respond-below('sm') {
  .confirm__panel {
    padding: $space-4;
  }

  .confirm__bar {
    flex-wrap: wrap;
    gap: $space-2;
    justify-content: space-between;
  }
}
</style>
