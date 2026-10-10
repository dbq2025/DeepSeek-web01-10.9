/**
 * 用户状态（登录态 / token / 角色）
 * 说明：管理员与前台用户共用一份登录态，用 role 区分。
 *      只持久化 token 与 role —— profile 不落盘，需各页面按需补拉（见 /api/auth/profile）
 */
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useUserStore = defineStore(
  'user',
  () => {
    /** @type {import('vue').Ref<string>} 登录凭证 */
    const token = ref('')
    /** @type {import('vue').Ref<'admin'|'user'|''>} 当前角色 */
    const role = ref('')
    /** @type {import('vue').Ref<object|null>} 用户信息 */
    const profile = ref(null)

    /** 是否已登录 */
    const isLogin = computed(() => !!token.value)
    /** 是否管理员 */
    const isAdmin = computed(() => role.value === 'admin')

    /**
     * 设置登录态
     * @param {{ token: string, role: 'admin'|'user', profile?: object }} payload
     */
    function setLogin({ token: t, role: r, profile: p }) {
      token.value = t
      role.value = r
      profile.value = p || null
    }

    /** 退出登录，清空登录态 */
    function logout() {
      token.value = ''
      role.value = ''
      profile.value = null
    }

    /**
     * 更新本地用户信息（个人信息修改成功后调用）
     * @param {object} payload 新的用户信息
     * @returns {void}
     */
    function updateProfile(payload) {
      profile.value = { ...profile.value, ...payload }
    }

    return { token, role, profile, isLogin, isAdmin, setLogin, logout, updateProfile }
  },
  // 仅持久化 token（规范见 CLAUDE.md 第 4 章）
  { persist: { pick: ['token', 'role'] } }
)
