/**
 * 权限服务核心实现
 */
import type { UserInfo, Menu, LoginParams, LoginResponse } from '@/types/auth'
import { ErrorCode, AppError } from '@/types/error'
import { http } from '@/services/http'
import { storage } from '@/services/storage'

/** 存储键 */
const STORAGE_KEYS = {
    USER: 'mes-wms-user',
    MENUS: 'mes-wms-menus',
    PERMISSIONS: 'mes-wms-permissions',
}

/** 用户信息缓存 */
let cachedUserInfo: UserInfo | null = null
let cachedPermissions: string[] = []
let cachedMenus: Menu[] = []

/**
 * 初始化权限缓存
 * 从本地存储恢复权限数据
 */
export const initAuthCache = (): void => {
    try {
        const userStr = uni.getStorageSync(STORAGE_KEYS.USER)
        if (userStr) {
            cachedUserInfo = JSON.parse(userStr)
            cachedPermissions = cachedUserInfo?.permissions || []
        }

        const menusStr = uni.getStorageSync(STORAGE_KEYS.MENUS)
        if (menusStr) {
            cachedMenus = JSON.parse(menusStr)
        }
    } catch {
        // ignore
    }
}

/**
 * 保存用户信息到缓存和本地存储
 */
const saveUserInfo = (userInfo: UserInfo): void => {
    cachedUserInfo = userInfo
    cachedPermissions = userInfo.permissions || []

    try {
        uni.setStorageSync(STORAGE_KEYS.USER, JSON.stringify(userInfo))
    } catch {
        // ignore
    }
}

/**
 * 保存菜单到缓存和本地存储
 */
const saveMenus = (menus: Menu[]): void => {
    cachedMenus = menus

    try {
        uni.setStorageSync(STORAGE_KEYS.MENUS, JSON.stringify(menus))
    } catch {
        // ignore
    }
}

/**
 * 清除所有权限缓存
 */
const clearAuthCache = (): void => {
    cachedUserInfo = null
    cachedPermissions = []
    cachedMenus = []

    try {
        uni.removeStorageSync(STORAGE_KEYS.USER)
        uni.removeStorageSync(STORAGE_KEYS.MENUS)
        uni.removeStorageSync(STORAGE_KEYS.PERMISSIONS)
    } catch {
        // ignore
    }
}

/**
 * 用户登录
 */
export const login = async (params: LoginParams): Promise<LoginResponse> => {
    const { username, password, captcha, remember } = params

    try {
        const response = await http.post<LoginResponse>('/auth/login', {
            username,
            password,
            captcha,
        })

        const { userInfo, menus } = response.data

        // 保存用户信息和菜单
        saveUserInfo(userInfo)
        saveMenus(menus)

        // 记住密码
        if (remember) {
            try {
                uni.setStorageSync('mes-wms-remember', JSON.stringify({ username, password }))
            } catch {
                // ignore
            }
        }

        return response.data
    } catch (error) {
        throw error
    }
}

/**
 * 用户登出
 */
export const logout = async (): Promise<void> => {
    try {
        await http.post('/auth/logout')
    } catch {
        // 即使请求失败也要清除本地缓存
    } finally {
        clearAuthCache()
        // 跳转到登录页
        uni.reLaunch({ url: '/pages/login/index' })
    }
}

/**
 * 获取用户信息
 */
export const getUserInfo = (): UserInfo | null => {
    return cachedUserInfo
}

/**
 * 获取用户权限列表
 */
export const getPermissions = (): string[] => {
    return cachedPermissions
}

/**
 * 获取菜单列表
 */
export const getMenus = (): Menu[] => {
    return cachedMenus
}

/**
 * 检查是否有指定权限
 * @param permission 权限码
 */
export const hasPermission = (permission: string): boolean => {
    if (!permission) return true
    return cachedPermissions.includes(permission)
}

/**
 * 检查是否有任意一个权限
 * @param permissions 权限码数组
 */
export const hasAnyPermission = (permissions: string[]): boolean => {
    if (!permissions || permissions.length === 0) return true
    return permissions.some(p => cachedPermissions.includes(p))
}

/**
 * 检查是否有所有权限
 * @param permissions 权限码数组
 */
export const hasAllPermissions = (permissions: string[]): boolean => {
    if (!permissions || permissions.length === 0) return true
    return permissions.every(p => cachedPermissions.includes(p))
}

/**
 * 检查是否有指定角色
 * @param role 角色码
 */
export const hasRole = (role: string): boolean => {
    if (!role) return true
    return cachedUserInfo?.roles?.includes(role) || false
}

/**
 * 检查是否有页面访问权限
 * @param pageCode 页面编码
 */
export const hasPageAccess = (pageCode: string): boolean => {
    if (!pageCode) return true
    // 页面权限码格式：page:{pageCode}
    return cachedPermissions.includes(`page:${pageCode}`) || cachedPermissions.includes(pageCode)
}

/**
 * 检查是否已登录
 */
export const isLoggedIn = (): boolean => {
    return !!cachedUserInfo?.token
}

/**
 * 检查令牌是否有效
 */
export const isTokenValid = (): boolean => {
    if (!cachedUserInfo?.token || !cachedUserInfo?.tokenExpireTime) {
        return false
    }
    return Date.now() < cachedUserInfo.tokenExpireTime
}

/**
 * 刷新用户信息
 */
export const refreshUserInfo = async (): Promise<UserInfo> => {
    const response = await http.get<UserInfo>('/auth/user-info')
    saveUserInfo(response.data)
    return response.data
}

/**
 * 刷新菜单
 */
export const refreshMenus = async (): Promise<Menu[]> => {
    const response = await http.get<Menu[]>('/user/menus')
    saveMenus(response.data)
    return response.data
}

/** 权限服务导出 */
export const authService = {
    initAuthCache,
    login,
    logout,
    getUserInfo,
    getPermissions,
    getMenus,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasPageAccess,
    isLoggedIn,
    isTokenValid,
    refreshUserInfo,
    refreshMenus,
}

export default authService
