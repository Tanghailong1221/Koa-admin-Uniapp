/**
 * 权限模块相关类型定义
 */

/** 用户信息 */
export interface UserInfo {
    /** 用户ID */
    id: string
    /** 用户名 */
    username: string
    /** 真实姓名 */
    realName: string
    /** 头像 */
    avatar?: string
    /** 部门 */
    department?: string
    /** 手机号 */
    phone?: string
    /** 邮箱 */
    email?: string
    /** 角色列表 */
    roles: string[]
    /** 权限列表 */
    permissions: string[]
    /** 访问令牌 */
    token: string
    /** 刷新令牌 */
    refreshToken: string
    /** 令牌过期时间（时间戳） */
    tokenExpireTime: number
}

/** 角色 */
export interface Role {
    /** 角色ID */
    id: string
    /** 角色编码 */
    code: string
    /** 角色名称 */
    name: string
    /** 角色描述 */
    description?: string
    /** 权限列表 */
    permissions: Permission[]
}

/** 权限 */
export interface Permission {
    /** 权限ID */
    id: string
    /** 权限编码 */
    code: string
    /** 权限名称 */
    name: string
    /** 权限类型 */
    type: PermissionType
    /** 资源编码 */
    resourceCode?: string
    /** 父级权限ID */
    parentId?: string
}

/** 权限类型 */
export type PermissionType = 'menu' | 'page' | 'button' | 'data'

/** 菜单 */
export interface Menu {
    /** 菜单ID */
    id: string
    /** 菜单编码 */
    code: string
    /** 菜单名称 */
    name: string
    /** 菜单图标 */
    icon?: string
    /** 菜单路径 */
    path: string
    /** 所需权限 */
    permission?: string
    /** 子菜单 */
    children?: Menu[]
    /** 排序 */
    sort: number
    /** 是否隐藏 */
    hidden?: boolean
    /** 是否缓存 */
    keepAlive?: boolean
}

/** 认证服务接口 */
export interface AuthService {
    /** 登录 */
    login(username: string, password: string): Promise<UserInfo>
    /** 登出 */
    logout(): Promise<void>
    /** 刷新令牌 */
    refreshToken(): Promise<string>
    /** 获取用户信息 */
    getUserInfo(): UserInfo | null
    /** 检查是否有权限 */
    hasPermission(permission: string): boolean
    /** 检查是否有角色 */
    hasRole(role: string): boolean
    /** 检查是否有页面访问权限 */
    hasPageAccess(pageCode: string): boolean
}

/** 登录参数 */
export interface LoginParams {
    /** 用户名 */
    username: string
    /** 密码 */
    password: string
    /** 验证码 */
    captcha?: string
    /** 记住密码 */
    remember?: boolean
}

/** 登录响应 */
export interface LoginResponse {
    /** 用户信息 */
    userInfo: UserInfo
    /** 菜单列表 */
    menus: Menu[]
}
