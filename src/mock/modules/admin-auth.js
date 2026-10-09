/**
 * Mock：管理员认证接口
 * 对应 api/admin/auth.js
 */
import { getDb } from '../db.js'
import { ok, fail, buildToken, currentUser, publicUser } from '../helpers.js'

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
      const user = currentUser({ headers }, db.users)
      if (!user || user.role !== 'admin') return fail('未登录或登录已过期', 401)
      return ok(publicUser(user))
    }
  },
  {
    url: '/api/admin/profile',
    method: 'put',
    response: ({ body, headers }) => {
      const db = getDb()
      const user = currentUser({ headers }, db.users)
      if (!user || user.role !== 'admin') return fail('未登录或登录已过期', 401)
      const { nickname, phone, avatar } = body || {}
      if (nickname !== undefined) user.nickname = nickname
      if (phone !== undefined) user.phone = phone
      if (avatar !== undefined) user.avatar = avatar
      return ok(publicUser(user))
    }
  }
]
