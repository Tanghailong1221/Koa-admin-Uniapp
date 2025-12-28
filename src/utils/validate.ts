// 验证工具函数
export const isPhone = (value: string): boolean => {
    return /^1[3-9]\d{9}$/.test(value)
}

export const isEmail = (value: string): boolean => {
    return /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/.test(value)
}

export const isEmpty = (value: unknown): boolean => {
    if (value === null || value === undefined) return true
    if (typeof value === 'string') return value.trim() === ''
    if (Array.isArray(value)) return value.length === 0
    if (typeof value === 'object') return Object.keys(value).length === 0
    return false
}
