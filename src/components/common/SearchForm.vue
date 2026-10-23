<!--
  通用搜索栏
  职责：由 fields 配置驱动渲染筛选项，统一「查询 / 重置」按钮与右侧扩展插槽
  说明：筛选值直接写入父组件传入的响应式查询对象（父组件用 useTable 的 reactive query 承载），
       避免为每个字段单独 emit 一次，减少样板代码。
       因此这里对 vue/no-mutating-props 做定向豁免：被修改的是父级 reactive 对象的属性，
       而非 prop 本身，运行时不会出现「子组件改 prop」的问题。
  用法：
    <SearchForm :model-value="query" :fields="searchFields" :loading="loading"
      @search="search" @reset="reset">
      <el-button type="primary" @click="open()">新增类型</el-button>
    </SearchForm>
-->
<template>
  <!-- eslint-disable vue/no-mutating-props -->
  <el-form class="search-form" :model="modelValue" :inline="true" @submit.prevent>
    <el-form-item v-for="field in fields" :key="field.prop" :label="field.label">
      <el-select
        v-if="field.type === 'select'"
        v-model="modelValue[field.prop]"
        :placeholder="field.placeholder || `请选择${field.label}`"
        :clearable="field.clearable !== false"
        :style="{ width: field.width || '160px' }"
      >
        <el-option
          v-for="option in field.options || []"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </el-select>

      <el-date-picker
        v-else-if="field.type === 'date'"
        v-model="modelValue[field.prop]"
        type="date"
        :placeholder="field.placeholder || `请选择${field.label}`"
        :style="{ width: field.width || '180px' }"
      />

      <el-input
        v-else
        v-model="modelValue[field.prop]"
        :placeholder="field.placeholder || `请输入${field.label}`"
        :clearable="field.clearable !== false"
        :style="{ width: field.width || '200px' }"
        @keyup.enter="emit('search')"
      />
    </el-form-item>

    <el-form-item>
      <el-button type="primary" :loading="loading" @click="emit('search')">查询</el-button>
      <el-button @click="emit('reset')">重置</el-button>
    </el-form-item>

    <!-- 右侧扩展区：通常放「新增」等主操作按钮 -->
    <div class="search-form__extra">
      <slot />
    </div>
  </el-form>
</template>

<script setup>
defineProps({
  /**
   * 查询条件对象（由父组件用 reactive 承载，本组件直接写入各字段）
   * @type {object}
   */
  modelValue: { type: Object, required: true },
  /**
   * 筛选项配置
   * @type {Array<{prop:string,label:string,type?:'input'|'select'|'date',options?:Array<{label:string,value:any}>,placeholder?:string,width?:string,clearable?:boolean}>}
   */
  fields: { type: Array, default: () => [] },
  /** 查询按钮 loading @type {boolean} */
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['search', 'reset'])
</script>

<style scoped lang="scss">
// 一整块筛选卡：label 13 灰、控件 36 高、右侧主操作贴边
.search-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0 4px;
  padding: $space-4 $space-5 2px;
  margin-bottom: $space-4;
  background: var(--app-bg-card);
  border: 1px solid transparent;
  border-radius: var(--app-radius-card);
  box-shadow: var(--app-shadow-card);

  :deep(.el-form-item) {
    margin-right: $space-4;
    margin-bottom: $space-3;
  }

  :deep(.el-form-item__label) {
    color: var(--app-text-3);
    font-size: $font-13;
    font-weight: 500;
  }

  // 控件统一 36px 高（与按钮同一水平线）
  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper) {
    min-height: 36px;
  }

  &__extra {
    margin-left: auto;
    margin-bottom: $space-3;
  }
}

@include respond-below('sm') {
  .search-form {
    padding: $space-3 $space-4 2px;

    :deep(.el-form-item) {
      width: 100%;
      margin-right: 0;
    }

    :deep(.el-input),
    :deep(.el-select) {
      width: 100% !important;
    }

    &__extra {
      margin-left: 0;
    }
  }
}
</style>
