/**
 * Mock：管理员认证接口
 * 对应 api/admin/auth.js
 */
import { getDb } from '../db.js'
import { ok, fail, buildToken, requireUser, publicUser } from '../helpers.js'
import { checkNickname, checkPhone } from '../../utils/validate.js'

export default [
  {
    url: '/api/admin/login',
    method: 'post',
    response: ({ body }) => {
      const { username, password } = body || {}
      const db = getDb()
      const user = db.users.find((u) => u.username === username)
      if (!user || user.password !== password) {
        return fail('用户名或密码错误', 400)
      }
      if (user.role !== 'admin') {
        return fail('该账号没有后台管理权限', 403)
      }
      return ok({ token: buildToken(user), role: user.role, profile: publicUser(user) })
    }
  },
  {
    url: '/api/admin/logout',
    method: 'post',
    response: () => ok(null)
  },
  {
    url: '/api/admin/profile',
    method: 'get',
    response: ({ headers }) => {
      const db = getDb()
      const { user, error } = requireUser({ headers }, db.users, 'admin')
      if (error) return error
      return ok(publicUser(user))
    }
  },
  {
    url: '/api/admin/profile',
    method: 'put',
    response: ({ body, headers }) => {
      const db = getDb()
      const { user, error } = requireUser({ headers }, db.users, 'admin')
      if (error) return error
      const { nickname, phone, avatar } = body || {}
      if (nickname !== undefined) {
        if (!String(nickname).trim()) return fail('昵称不能为空', 400)
        const nicknameError = checkNickname(nickname)
        if (nicknameError) return fail(nicknameError, 400)
        user.nickname = nickname
      }
      if (phone !== undefined) {
        const phoneError = checkPhone(phone)
        if (phoneError) return fail(phoneError, 400)
        user.phone = phone
      }
      if (avatar !== undefined) user.avatar = avatar
      return ok(publicUser(user))
    }
  }
]
