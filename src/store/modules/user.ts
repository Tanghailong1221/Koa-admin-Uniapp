import { defineStore } from 'pinia'
import type { UserInfo, Menu } from '@/types/auth'

interface UserState {
    token: string
    refreshToken: string
    tokenExpireTime: number
    userInfo: UserInfo | null
    permissions: string[]
    roles: string[]
    menus: Menu[]
}

export const useUserStore = defineStore('user', {
    state: (): UserState => ({
        token: '',
        refreshToken: '',
        tokenExpireTime: 0,
        userInfo: null,
        permissions: [],
        roles: [],
        menus: [],
    }),
    getters: {
        isLoggedIn: state => !!state.token,
        isTokenValid: state => {
            if (!state.token || !state.tokenExpireTime) return false
            return Date.now() < state.tokenExpireTime
        },
        username: state => state.userInfo?.username || '',
        realName: state => state.userInfo?.realName || '',
    },
    actions: {
        setToken(token: string, refreshToken?: string, expireTime?: number) {
            this.token = token
            if (refreshToken) {
                this.refreshToken = refreshToken
            }
            if (expireTime) {
                this.tokenExpireTime = expireTime
            }
        },
        setUserInfo(userInfo: UserInfo) {
            this.userInfo = userInfo
            this.permissions = userInfo.permissions || []
            this.roles = userInfo.roles || []
            this.token = userInfo.token
            this.refreshToken = userInfo.refreshToken
            this.tokenExpireTime = userInfo.tokenExpireTime
        },
        setMenus(menus: Menu[]) {
            this.menus = menus
        },
        hasPermission(permission: string): boolean {
            if (!permission) return true
            return this.permissions.includes(permission)
        },
        hasAnyPermission(permissions: string[]): boolean {
            if (!permissions || permissions.length === 0) return true
            return permissions.some(p => this.permissions.includes(p))
        },
        hasAllPermissions(permissions: string[]): boolean {
            if (!permissions || permissions.length === 0) return true
            return permissions.every(p => this.permissions.includes(p))
        },
        hasRole(role: string): boolean {
            if (!role) return true
            return this.roles.includes(role)
        },
        hasPageAccess(pageCode: string): boolean {
            if (!pageCode) return true
            return this.permissions.includes(`page:${pageCode}`) || this.permissions.includes(pageCode)
        },
        clearUser() {
            this.token = ''
            this.refreshToken = ''
            this.tokenExpireTime = 0
            this.userInfo = null
            this.permissions = []
            this.roles = []
            this.menus = []
        },
    },
    persist: {
        key: 'mes-wms-user',
        paths: ['token', 'refreshToken', 'tokenExpireTime', 'userInfo', 'permissions', 'roles'],
    },
})
