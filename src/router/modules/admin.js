/**
 * 后台管理路由（/admin/*）
 * 结构：/admin/login 独立页 + /admin Layout 嵌套子路由
 * 权限：除 login 外均要求 role = 'admin'
 * 注意：骨架占位 —— 对应的 views/admin/** 页面文件需按此路径创建
 */
export default [
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('@/views/admin/login/index.vue'),
    meta: { title: '管理员登录' }
  },
  {
    path: '/admin',
    name: 'AdminLayout',
    component: () => import('@/views/admin/layout/index.vue'),
    redirect: '/admin/dashboard',
    meta: { title: '后台管理', requiresAuth: true, role: 'admin' },
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/dashboard/index.vue'),
        meta: { title: '数据统计', requiresAuth: true, role: 'admin', icon: 'DataLine' }
      },
      {
        path: 'category',
        name: 'CategoryManage',
        component: () => import('@/views/admin/category/index.vue'),
        meta: { title: '商品类型管理', requiresAuth: true, role: 'admin', icon: 'Menu' }
      },
      {
        path: 'goods',
        name: 'GoodsManage',
        component: () => import('@/views/admin/goods/index.vue'),
        meta: { title: '商品信息管理', requiresAuth: true, role: 'admin', icon: 'Goods' }
      },
      {
        path: 'goods/create',
        name: 'GoodsCreate',
        component: () => import('@/views/admin/goods/edit.vue'),
        meta: { title: '新增商品', requiresAuth: true, role: 'admin' }
      },
      {
        path: 'goods/edit/:id',
        name: 'GoodsEdit',
        component: () => import('@/views/admin/goods/edit.vue'),
        props: true,
        meta: { title: '编辑商品', requiresAuth: true, role: 'admin' }
      },
      {
        path: 'order',
        name: 'OrderManage',
        component: () => import('@/views/admin/order/index.vue'),
        meta: { title: '订单管理', requiresAuth: true, role: 'admin', icon: 'List' }
      },
      {
        path: 'order/:id',
        name: 'AdminOrderDetail',
        component: () => import('@/views/admin/order/detail.vue'),
        props: true,
        meta: { title: '订单详情', requiresAuth: true, role: 'admin' }
      },
      {
        path: 'profile',
        name: 'AdminProfile',
        component: () => import('@/views/admin/profile/index.vue'),
        meta: { title: '管理员信息', requiresAuth: true, role: 'admin', icon: 'User' }
      }
    ]
  }
]
