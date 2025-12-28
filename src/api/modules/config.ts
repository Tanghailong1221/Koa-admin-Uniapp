// 配置相关API
import { http } from '@services/http'
import type { PageConfig } from '@/types'

export const configApi = {
    getPageConfig(pageCode: string) {
        return http.get<PageConfig>(`/config/page/${pageCode}`)
    },
    getAppConfig() {
        return http.get<Record<string, unknown>>('/config/app')
    },
}
