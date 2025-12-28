// 应用配置
export const appConfig = {
    // API基础地址
    baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
    // 请求超时时间
    timeout: 30000,
    // 最大重试次数
    maxRetry: 3,
    // 重试间隔基数（毫秒）
    retryDelay: 1000,
    // 令牌刷新阈值（秒）
    tokenRefreshThreshold: 300,
    // 日志上传阈值
    logUploadThreshold: 50,
    // 离线队列最大长度
    maxOfflineQueueSize: 100,
}
