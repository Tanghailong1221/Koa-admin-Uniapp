// 用户相关API
import { http } from '@services/http'
import type { Menu } from '@/types'

export const userApi = {
    getMenus() {
        return http.get<Menu[]>('/user/menus')
    },
    updatePassword(oldPassword: string, newPassword: string) {
        return http.post('/user/password', { oldPassword, newPassword })
    },
}
