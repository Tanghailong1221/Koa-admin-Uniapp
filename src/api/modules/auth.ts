// 认证相关API
import { http } from '@services/http'
import type { UserInfo } from '@/types'

export const authApi = {
    login(username: string, password: string) {
        return http.post<UserInfo>('/auth/login', { username, password })
    },
    logout() {
        return http.post('/auth/logout')
    },
    refreshToken(refreshToken: string) {
        return http.post<{ token: string; refreshToken: string }>('/auth/refresh', { refreshToken })
    },
    getUserInfo() {
        return http.get<UserInfo>('/auth/user-info')
    },
}
