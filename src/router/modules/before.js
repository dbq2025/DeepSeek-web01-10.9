/**
 * 电商前台路由
 * 结构：/ Layout 嵌套子路由 + /login、/register 独立页 + 404 兜底
 * 权限：购物车 / 订单 / 收藏 / 个人中心要求登录（role = 'user'）
 * 注意：骨架占位 —— 对应的 views/before/** 页面文件需按此路径创建
 */
export default [
  {
    path: '/',
    name: 'BeforeLayout',
    component: () => import('@/views/before/layout/index.vue'),
    redirect: '/home',
    children: [
      {
        path: 'home',
        name: 'Home',
        component: () => import('@/views/before/home/index.vue'),
        meta: { title: '首页' }
      },
      {
        path: 'search',
        name: 'Search',
        component: () => import('@/views/before/search/index.vue'),
        meta: { title: '商品搜索' }
      },
      {
        path: 'goods/:id',
        name: 'GoodsDetail',
        component: () => import('@/views/before/goods/detail.vue'),
        props: true,
        meta: { title: '商品详情' }
      },
      {
        path: 'cart',
        name: 'Cart',
        component: () => import('@/views/before/cart/index.vue'),
        meta: { title: '购物车', requiresAuth: true, role: 'user' }
      },
      {
        path: 'order/confirm',
        name: 'OrderConfirm',
        component: () => import('@/views/before/order/confirm.vue'),
        meta: { title: '订单确认', requiresAuth: true, role: 'user' }
      },
      {
        path: 'order/list',
        name: 'OrderList',
        component: () => import('@/views/before/order/list.vue'),
        meta: { title: '我的订单', requiresAuth: true, role: 'user' }
      },
      {
        path: 'order/detail/:id',
        name: 'FrontOrderDetail',
        component: () => import('@/views/before/order/detail.vue'),
        props: true,
        meta: { title: '订单详情', requiresAuth: true, role: 'user' }
      },
      {
        path: 'favorite',
        name: 'Favorite',
        component: () => import('@/views/before/user/favorite.vue'),
        meta: { title: '我的收藏', requiresAuth: true, role: 'user' }
      },
      {
        // 开发自测页：集中演示 components/common 下的通用组件（非业务页面，无需登录）
        path: 'demo',
        name: 'Demo',
        component: () => import('@/views/demo/index.vue'),
        meta: { title: '通用组件演示' }
      },
      {
        path: 'user',
        name: 'UserCenter',
        component: () => import('@/views/before/user/index.vue'),
        redirect: '/user/profile',
        meta: { title: '个人中心', requiresAuth: true, role: 'user' },
        children: [
          {
            // 嵌套子视图：个人信息
            path: 'profile',
            name: 'UserProfile',
            component: () => import('@/views/before/user/profile.vue'),
            meta: { title: '个人信息', requiresAuth: true, role: 'user' }
          }
        ]
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/before/login/index.vue'),
    meta: { title: '用户登录' }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/before/register/index.vue'),
    meta: { title: '用户注册' }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '页面不存在' }
  }
]
