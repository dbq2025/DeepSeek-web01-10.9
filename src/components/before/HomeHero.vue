<!--
  首页首屏轮播（Hero）
  职责：图片 + 左侧渐变遮罩 + HTML 文案层的组合，替代改造前「纯色块 + 图内一行文字」
  说明：1) 文案用 HTML 渲染，可响应式、可换行、可加按钮，不依赖图片里的字；
       2) tag / subtitle / cta 是 Mock 新增字段，旧数据缺失时用 v-if 兜底；
       3) 指示器自绘（8px 圆点 → 24px 胶囊），比 el-carousel 默认的横条更贴合整站圆角语言
-->
<template>
  <section class="hero">
    <el-carousel
      ref="carouselRef"
      class="hero__carousel"
      height="360px"
      :interval="5000"
      arrow="hover"
      indicator-position="none"
      :autoplay="true"
      @change="onChange"
    >
      <el-carousel-item v-for="item in banners" :key="item.id">
        <div class="hero__slide">
          <img class="hero__img" :src="item.image" :alt="item.title" />
          <div class="hero__mask" />
          <div class="hero__content">
            <span v-if="item.tag" class="hero__tag">{{ item.tag }}</span>
            <h2 class="hero__title">{{ item.title }}</h2>
            <p v-if="item.subtitle" class="hero__subtitle">{{ item.subtitle }}</p>
            <router-link class="hero__cta" :to="{ path: '/search' }">
              {{ item.cta || '去逛逛' }}
              <el-icon><ArrowRight /></el-icon>
            </router-link>
          </div>
        </div>
      </el-carousel-item>
    </el-carousel>

    <!-- 自绘指示器：当前帧拉长成胶囊，便于一眼识别进度 -->
    <div v-if="banners.length > 1" class="hero__dots">
      <button
        v-for="(item, index) in banners"
        :key="item.id"
        class="hero__dot"
        :class="{ 'is-active': index === activeIndex }"
        type="button"
        :aria-label="`第 ${index + 1} 张`"
        @click="goTo(index)"
      />
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { ArrowRight } from '@element-plus/icons-vue'

defineProps({
  /** 轮播数据（含 image / tag / title / subtitle / cta） @type {Array<object>} */
  banners: { type: Array, default: () => [] }
})

const carouselRef = ref(null)
const activeIndex = ref(0)

/**
 * 轮播切换回调
 * @param {number} index 当前帧
 * @returns {void}
 */
function onChange(index) {
  activeIndex.value = index
}

/**
 * 跳到指定帧
 * @param {number} index 目标帧
 * @returns {void}
 */
function goTo(index) {
  carouselRef.value?.setActiveItem(index)
}
</script>

<style scoped lang="scss">
.hero {
  position: relative;
  overflow: hidden;
  border-radius: var(--app-radius-panel);
  box-shadow: var(--app-shadow-3);

  &__carousel {
    // 让内部容器跟随外框圆角
    :deep(.el-carousel__container) {
      border-radius: var(--app-radius-panel);
    }

    :deep(.el-carousel__arrow) {
      width: 36px;
      height: 36px;
      background: rgb(255 255 255 / 22%);
      backdrop-filter: blur(6px);
    }
  }

  &__slide {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  &__img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  // 左侧渐变遮罩：保证白色文案在任意底图上都有足够对比度
  &__mask {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      rgb(8 14 30 / 72%) 0%,
      rgb(8 14 30 / 42%) 38%,
      rgb(8 14 30 / 0%) 68%
    );
  }

  &__content {
    position: absolute;
    top: 50%;
    left: 56px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
    max-width: 560px;
    transform: translateY(-50%);
  }

  &__tag {
    padding: 4px 12px;
    background: rgb(255 255 255 / 16%);
    border: 1px solid rgb(255 255 255 / 24%);
    border-radius: $radius-pill;
    color: #fff;
    font-size: $font-12;
    font-weight: 500;
    letter-spacing: 0.02em;
  }

  &__title {
    margin: 0;
    color: #fff;
    font-size: 36px;
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.22;
    text-shadow: 0 1px 12px rgb(8 14 30 / 35%);
  }

  &__subtitle {
    margin: 0;
    color: rgb(255 255 255 / 85%);
    font-size: 15px;
    line-height: 1.6;
  }

  &__cta {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 42px;
    margin-top: 4px;
    padding: 0 22px;
    background: #fff;
    border-radius: $radius-pill;
    color: var(--app-text-1);
    font-size: $font-14;
    font-weight: 600;
    text-decoration: none;
    transition:
      transform var(--app-dur) var(--app-ease),
      box-shadow var(--app-dur) var(--app-ease);
    @include focus-ring;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 20px rgb(8 14 30 / 28%);
    }
  }

  &__dots {
    position: absolute;
    bottom: 20px;
    left: 56px;
    display: flex;
    gap: 6px;
    z-index: 2;
  }

  &__dot {
    width: 8px;
    height: 8px;
    padding: 0;
    background: rgb(255 255 255 / 45%);
    border: none;
    border-radius: $radius-pill;
    cursor: pointer;
    transition:
      width var(--app-dur) var(--app-ease),
      background var(--app-dur) var(--app-ease);

    &.is-active {
      width: 24px;
      background: #fff;
    }
  }
}

// 平板：文案略缩，位置内收
@include respond-below('lg') {
  .hero__content {
    left: 40px;
    max-width: 460px;
  }

  .hero__title {
    font-size: $font-30;
  }
}

// 手机：轮播按原图比例（1200:360）留高，文案缩到 2 行以内，避免遮挡底图主体
@include respond-below('sm') {
  .hero {
    border-radius: var(--app-radius-card);

    :deep(.el-carousel__container) {
      height: auto !important;
      aspect-ratio: 10 / 3;
      border-radius: var(--app-radius-card);
    }
  }

  .hero__content {
    left: $space-5;
    gap: $space-2;
    max-width: 74%;
  }

  .hero__tag,
  .hero__subtitle {
    display: none;
  }

  .hero__title {
    font-size: 18px;
  }

  .hero__cta {
    height: 32px;
    padding: 0 14px;
    font-size: $font-12;
  }

  // 手机上文案与按钮几乎占满高度，指示器会与 CTA 重叠 → 直接隐藏（仍自动轮播）
  .hero__dots {
    display: none;
  }
}
</style>
