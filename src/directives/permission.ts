/**
 * 权限指令实现
 * v-permission 用于控制元素的显示/隐藏
 */
import type { Directive, DirectiveBinding } from 'vue'
import { authService } from '@/services/auth'

/** 权限指令绑定值类型 */
type PermissionValue = string | string[] | { permission: string | string[]; mode?: 'any' | 'all' }

/** 原始display样式存储键 */
const ORIGINAL_DISPLAY_KEY = '__v_permission_display__'

/**
 * 检查权限
 * @param binding 指令绑定值
 * @returns 是否有权限
 */
export const checkPermission = (value: PermissionValue): boolean => {
    if (!value) return true

    // 字符串形式：单个权限
    if (typeof value === 'string') {
        return authService.hasPermission(value)
    }

    // 数组形式：默认any模式
    if (Array.isArray(value)) {
        return authService.hasAnyPermission(value)
    }

    // 对象形式：可指定mode
    if (typeof value === 'object' && value.permission) {
        const { permission, mode = 'any' } = value
        const permissions = Array.isArray(permission) ? permission : [permission]

        if (mode === 'all') {
            return authService.hasAllPermissions(permissions)
        }
        return authService.hasAnyPermission(permissions)
    }

    return true
}

/**
 * 更新元素可见性
 */
const updateVisibility = (el: HTMLElement, binding: DirectiveBinding<PermissionValue>): void => {
    const hasPermission = checkPermission(binding.value)

    if (hasPermission) {
        // 恢复原始display
        const originalDisplay = (el as any)[ORIGINAL_DISPLAY_KEY]
        el.style.display = originalDisplay !== undefined ? originalDisplay : ''
    } else {
        // 保存原始display并隐藏
        if ((el as any)[ORIGINAL_DISPLAY_KEY] === undefined) {
            (el as any)[ORIGINAL_DISPLAY_KEY] = el.style.display
        }
        el.style.display = 'none'
    }
}

/**
 * v-permission 指令
 * 
 * 使用方式：
 * - v-permission="'user:create'" 单个权限
 * - v-permission="['user:create', 'user:edit']" 多个权限（任意一个）
 * - v-permission="{ permission: ['user:create', 'user:edit'], mode: 'all' }" 所有权限
 */
export const vPermission: Directive<HTMLElement, PermissionValue> = {
    mounted(el, binding) {
        updateVisibility(el, binding)
    },
    updated(el, binding) {
        updateVisibility(el, binding)
    },
}

/**
 * v-role 指令
 * 用于根据角色控制元素显示
 */
export const vRole: Directive<HTMLElement, string | string[]> = {
    mounted(el, binding) {
        const value = binding.value
        let hasRole = true

        if (typeof value === 'string') {
            hasRole = authService.hasRole(value)
        } else if (Array.isArray(value)) {
            hasRole = value.some(role => authService.hasRole(role))
        }

        if (!hasRole) {
            el.style.display = 'none'
        }
    },
    updated(el, binding) {
        const value = binding.value
        let hasRole = true

        if (typeof value === 'string') {
            hasRole = authService.hasRole(value)
        } else if (Array.isArray(value)) {
            hasRole = value.some(role => authService.hasRole(role))
        }

        el.style.display = hasRole ? '' : 'none'
    },
}

/**
 * 注册权限指令
 */
export const registerPermissionDirectives = (app: any): void => {
    app.directive('permission', vPermission)
    app.directive('role', vRole)
}

export default vPermission
