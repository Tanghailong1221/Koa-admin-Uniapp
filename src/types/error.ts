/**
 * 错误处理相关类型定义
 */

/** 错误码枚举 */
export enum ErrorCode {
    // 网络错误 1xxx
    NETWORK_ERROR = 1001,
    TIMEOUT_ERROR = 1002,
    ABORT_ERROR = 1003,

    // 认证错误 2xxx
    TOKEN_EXPIRED = 2001,
    TOKEN_INVALID = 2002,
    PERMISSION_DENIED = 2003,
    LOGIN_REQUIRED = 2004,
    REFRESH_TOKEN_FAILED = 2005,

    // 业务错误 3xxx
    VALIDATION_ERROR = 3001,
    BUSINESS_ERROR = 3002,
    DATA_NOT_FOUND = 3003,
    DUPLICATE_DATA = 3004,
    OPERATION_FAILED = 3005,

    // 系统错误 4xxx
    SYSTEM_ERROR = 4001,
    CONFIG_ERROR = 4002,
    STORAGE_ERROR = 4003,
    PARSE_ERROR = 4004,

    // 设备错误 5xxx
    SCANNER_ERROR = 5001,
    CAMERA_ERROR = 5002,
    DEVICE_NOT_SUPPORTED = 5003,
}

/** 应用错误类 */
export class AppError extends Error {
    /** 错误码 */
    code: ErrorCode
    /** 附加数据 */
    data?: Record<string, unknown>
    /** 原始错误 */
    cause?: Error

    constructor(
        code: ErrorCode,
        message: string,
        data?: Record<string, unknown>,
        cause?: Error
    ) {
        super(message)
        this.name = 'AppError'
        this.code = code
        this.data = data
        this.cause = cause

        // 保持原型链
        Object.setPrototypeOf(this, AppError.prototype)
    }

    /** 转换为JSON */
    toJSON() {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
            data: this.data,
            stack: this.stack,
        }
    }
}

/** 日志级别 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/** 日志条目 */
export interface LogEntry {
    /** 日志级别 */
    level: LogLevel
    /** 日志消息 */
    message: string
    /** 附加数据 */
    data?: Record<string, unknown>
    /** 时间戳 */
    timestamp: number
    /** 设备信息 */
    deviceInfo?: {
        type: string
        platform: string
        screenWidth: number
        screenHeight: number
    }
    /** 用户信息 */
    userInfo?: {
        id: string
        username: string
    }
    /** 错误堆栈 */
    stack?: string
    /** 页面路径 */
    page?: string
}

/** 日志服务接口 */
export interface LogService {
    /** 调试日志 */
    debug(message: string, data?: Record<string, unknown>): void
    /** 信息日志 */
    info(message: string, data?: Record<string, unknown>): void
    /** 警告日志 */
    warn(message: string, data?: Record<string, unknown>): void
    /** 错误日志 */
    error(message: string, error?: Error, data?: Record<string, unknown>): void
    /** 上传日志 */
    flush(): Promise<void>
    /** 获取最近日志 */
    getRecentLogs(count?: number): LogEntry[]
    /** 清除日志 */
    clearLogs(): void
}

/** 错误处理器 */
export interface ErrorHandler {
    /** 处理错误 */
    handle(error: Error | AppError): void
    /** 显示错误提示 */
    showError(message: string): void
    /** 上报错误 */
    report(error: Error | AppError): Promise<void>
}

/** 错误码消息映射 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
    [ErrorCode.NETWORK_ERROR]: '网络连接失败，请检查网络设置',
    [ErrorCode.TIMEOUT_ERROR]: '请求超时，请稍后重试',
    [ErrorCode.ABORT_ERROR]: '请求已取消',
    [ErrorCode.TOKEN_EXPIRED]: '登录已过期，请重新登录',
    [ErrorCode.TOKEN_INVALID]: '登录信息无效，请重新登录',
    [ErrorCode.PERMISSION_DENIED]: '权限不足，无法执行此操作',
    [ErrorCode.LOGIN_REQUIRED]: '请先登录',
    [ErrorCode.REFRESH_TOKEN_FAILED]: '刷新令牌失败，请重新登录',
    [ErrorCode.VALIDATION_ERROR]: '数据验证失败',
    [ErrorCode.BUSINESS_ERROR]: '业务处理失败',
    [ErrorCode.DATA_NOT_FOUND]: '数据不存在',
    [ErrorCode.DUPLICATE_DATA]: '数据已存在',
    [ErrorCode.OPERATION_FAILED]: '操作失败',
    [ErrorCode.SYSTEM_ERROR]: '系统错误，请稍后重试',
    [ErrorCode.CONFIG_ERROR]: '配置错误',
    [ErrorCode.STORAGE_ERROR]: '存储错误',
    [ErrorCode.PARSE_ERROR]: '数据解析错误',
    [ErrorCode.SCANNER_ERROR]: '扫码失败',
    [ErrorCode.CAMERA_ERROR]: '相机启动失败',
    [ErrorCode.DEVICE_NOT_SUPPORTED]: '设备不支持此功能',
}
