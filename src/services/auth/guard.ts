/**
 * 路由权限守卫
 */
import { authService } from './index'

/** 白名单页面（无需登录） */
const WHITE_LIST = [
    '/pages/login/index',
    '/pages/login/index.html',
]

/** 页面权限配置 */
interface PagePermissionConfig {
    /** 页面路径 */
    path: string
    /** 所需权限 */
    permission?: string
    /** 所需角色 */
    role?: string
}

/** 页面权限映射 */
const pagePermissions: PagePermissionConfig[] = []

/**
 * 注册页面权限
 */
export const registerPagePermission = (config: PagePermissionConfig): void => {
    const index = pagePermissions.findIndex(p => p.path === config.path)
    if (index >= 0) {
        pagePermissions[index] = config
    } else {
        pagePermissions.push(config)
    }
}

/**
 * 获取页面权限配置
 */
const getPagePermission = (path: string): PagePermissionConfig | undefined => {
    return pagePermissions.find(p => path.startsWith(p.path))
}

/**
 * 检查页面访问权限
 */
export const checkPageAccess = (path: string): { allowed: boolean; reason?: string } => {
    // 白名单页面直接放行
    if (WHITE_LIST.some(p => path.startsWith(p))) {
        return { allowed: true }
    }

    // 检查登录状态
    if (!authService.isLoggedIn()) {
        return { allowed: false, reason: 'not_logged_in' }
    }

    // 检查令牌有效性
    if (!authService.isTokenValid()) {
        return { allowed: false, reason: 'token_expired' }
    }

    // 获取页面权限配置
    const pageConfig = getPagePermission(path)
    if (!pageConfig) {
        // 没有配置权限的页面默认放行
        return { allowed: true }
    }

    // 检查权限
    if (pageConfig.permission && !authService.hasPermission(pageConfig.permission)) {
        return { allowed: false, reason: 'permission_denied' }
    }

    // 检查角色
    if (pageConfig.role && !authService.hasRole(pageConfig.role)) {
        return { allowed: false, reason: 'role_denied' }
    }

    return { allowed: true }
}

/**
 * 处理权限不足
 */
const handleAccessDenied = (reason: string): void => {
    switch (reason) {
        case 'not_logged_in':
        case 'token_expired':
            uni.showToast({
                title: '请先登录',
                icon: 'none',
                duration: 2000,
            })
            setTimeout(() => {
                uni.reLaunch({ url: '/pages/login/index' })
            }, 1000)
            break
        case 'permission_denied':
        case 'role_denied':
            uni.showToast({
                title: '权限不足',
                icon: 'none',
                duration: 2000,
            })
            setTimeout(() => {
                uni.navigateBack({ delta: 1 })
            }, 1000)
            break
        default:
            uni.showToast({
                title: '访问被拒绝',
                icon: 'none',
            })
    }
}

/**
 * 路由拦截器
 * 在页面跳转前检查权限
 */
export const setupRouteGuard = (): void => {
    // 拦截 navigateTo
    const originalNavigateTo = uni.navigateTo
    uni.navigateTo = (options: UniApp.NavigateToOptions) => {
        const { allowed, reason } = checkPageAccess(options.url)
        if (!allowed) {
            handleAccessDenied(reason!)
            return
        }
        return originalNavigateTo(options)
    }

    // 拦截 redirectTo
    const originalRedirectTo = uni.redirectTo
    uni.redirectTo = (options: UniApp.RedirectToOptions) => {
        const { allowed, reason } = checkPageAccess(options.url)
        if (!allowed) {
            handleAccessDenied(reason!)
            return
        }
        return originalRedirectTo(options)
    }

    // 拦截 reLaunch
    const originalReLaunch = uni.reLaunch
    uni.reLaunch = (options: UniApp.ReLaunchOptions) => {
        const { allowed, reason } = checkPageAccess(options.url)
        if (!allowed) {
            handleAccessDenied(reason!)
            return
        }
        return originalReLaunch(options)
    }

    // 拦截 switchTab
    const originalSwitchTab = uni.switchTab
    uni.switchTab = (options: UniApp.SwitchTabOptions) => {
        const { allowed, reason } = checkPageAccess(options.url)
        if (!allowed) {
            handleAccessDenied(reason!)
            return
        }
        return originalSwitchTab(options)
    }
}

/**
 * 页面进入守卫
 * 在页面onLoad中调用
 */
export const onPageEnter = (pagePath: string): boolean => {
    const { allowed, reason } = checkPageAccess(pagePath)
    if (!allowed) {
        handleAccessDenied(reason!)
        return false
    }
    return true
}

export default {
    setupRouteGuard,
    checkPageAccess,
    registerPagePermission,
    onPageEnter,
}
