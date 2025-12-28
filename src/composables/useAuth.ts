// 权限组合式函数占位
import { computed } from 'vue'
import { useUserStore } from '@store/modules/user'

export function useAuth() {
    const userStore = useUserStore()

    const isLoggedIn = computed(() => !!userStore.token)
    const permissions = computed(() => userStore.permissions)

    const hasPermission = (permission: string) => {
        return userStore.hasPermission(permission)
    }

    const hasRole = (role: string) => {
        return userStore.hasRole(role)
    }

    return {
        isLoggedIn,
        permissions,
        hasPermission,
        hasRole,
    }
}
