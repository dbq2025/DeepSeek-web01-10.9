/**
 * Mock：前台用户认证接口（注册 / 登录 / 个人信息）
 * 对应 api/before/auth.js
 */
import { getDb } from '../db.js'
import { ok, fail, buildToken, currentUser, publicUser, nextId, formatDateTime } from '../helpers.js'

export default [
  {
    url: '/api/auth/login',
    method: 'post',
    response: ({ body }) => {
      const { username, password } = body || {}
      const db = getDb()
      const user = db.users.find((u) => u.username === username)
      if (!user || user.password !== password) {
        return fail('用户名或密码错误', 400)
      }
      if (user.role !== 'user') {
        return fail('管理员账号请从后台入口登录', 403)
      }
      return ok({ token: buildToken(user), role: user.role, profile: publicUser(user) })
    }
  },
  {
    url: '/api/auth/register',
    method: 'post',
    response: ({ body }) => {
      const { username, password, nickname, phone } = body || {}
      const db = getDb()
      if (!username || !password) return fail('用户名和密码不能为空', 400)
      if (db.users.some((u) => u.username === username)) {
        return fail('该用户名已被注册', 400)
      }
      const user = {
        id: nextId(db.users),
        username,
        password,
        role: 'user',
        nickname: nickname || username,
        phone: phone || '',
        avatar: '',
        createTime: formatDateTime(new Date())
      }
      db.users.push(user)
      return ok({ token: buildToken(user), role: user.role, profile: publicUser(user) })
    }
  },
  {
    url: '/api/auth/profile',
    method: 'get',
    response: ({ headers }) => {
      const db = getDb()
      const user = currentUser({ headers }, db.users)
      if (!user) return fail('未登录或登录已过期', 401)
      return ok(publicUser(user))
    }
  },
  {
    url: '/api/auth/profile',
    method: 'put',
    response: ({ body, headers }) => {
      const db = getDb()
      const user = currentUser({ headers }, db.users)
      if (!user) return fail('未登录或登录已过期', 401)
      const { nickname, phone, avatar } = body || {}
      if (nickname !== undefined) user.nickname = nickname
      if (phone !== undefined) user.phone = phone
      if (avatar !== undefined) user.avatar = avatar
      return ok(publicUser(user))
    }
  }
]
