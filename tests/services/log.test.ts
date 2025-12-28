/**
 * 日志服务属性测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as fc from 'fast-check'
import {
    logService,
    getLogCache,
    clearLogCache,
    configureLog,
} from '../../src/services/log'
import type { LogLevel, LogEntry } from '../../src/types'

// Mock uni API
vi.mock('@/services/storage', () => ({
    storage: {
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
    },
}))

// Mock getCurrentPages
vi.stubGlobal('getCurrentPages', () => [{ route: '/pages/test/index' }])

// Mock uni.getSystemInfoSync
vi.stubGlobal('uni', {
    getSystemInfoSync: () => ({
        deviceType: 'phone',
        platform: 'android',
        screenWidth: 375,
        screenHeight: 812,
    }),
    getStorageSync: vi.fn(),
    setStorageSync: vi.fn(),
    removeStorageSync: vi.fn(),
    getStorage: vi.fn(),
    setStorage: vi.fn(),
    removeStorage: vi.fn(),
    request: vi.fn(),
    onUnhandledRejection: vi.fn(),
})

describe('日志服务属性测试', () => {
    beforeEach(() => {
        clearLogCache()
        configureLog({
            enableConsole: false,
            minLevel: 'debug',
            enableStorage: false,
        })
    })

    /**
     * 属性10: 错误日志完整性
     * 验证: 需求 7.1 - 错误日志必须包含完整的错误信息
     */
    describe('属性10: 错误日志完整性', () => {
        it('错误日志应包含错误名称和消息', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 100 }),
                    fc.string({ minLength: 1, maxLength: 200 }),
                    (errorName, errorMessage) => {
                        clearLogCache()

                        const error = new Error(errorMessage)
                        error.name = errorName

                        logService.error('Test error', error)

                        const logs = getLogCache()
                        expect(logs.length).toBe(1)

                        const logEntry = logs[0]
                        expect(logEntry.level).toBe('error')
                        expect(logEntry.data?.errorName).toBe(errorName)
                        expect(logEntry.data?.errorMessage).toBe(errorMessage)
                        expect(logEntry.stack).toBeDefined()
                    }
                ),
                { numRuns: 50 }
            )
        })

        it('错误日志应包含设备信息', () => {
            fc.assert(
                fc.property(fc.string({ minLength: 1, maxLength: 100 }), (message) => {
                    clearLogCache()

                    logService.error(message, new Error('test'))

                    const logs = getLogCache()
                    expect(logs.length).toBe(1)

                    const logEntry = logs[0]
                    expect(logEntry.deviceInfo).toBeDefined()
                    expect(logEntry.deviceInfo?.type).toBe('phone')
                    expect(logEntry.deviceInfo?.platform).toBe('android')
                }),
                { numRuns: 30 }
            )
        })

        it('错误日志应包含页面路径', () => {
            fc.assert(
                fc.property(fc.string({ minLength: 1, maxLength: 100 }), (message) => {
                    clearLogCache()

                    logService.error(message)

                    const logs = getLogCache()
                    expect(logs.length).toBe(1)
                    expect(logs[0].page).toBe('/pages/test/index')
                }),
                { numRuns: 30 }
            )
        })
    })

    /**
     * 日志级别过滤测试
     */
    describe('日志级别过滤', () => {
        it('应根据最小级别过滤日志', () => {
            const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
            const levelPriority: Record<LogLevel, number> = {
                debug: 0,
                info: 1,
                warn: 2,
                error: 3,
            }

            fc.assert(
                fc.property(
                    fc.constantFrom<LogLevel>('debug', 'info', 'warn', 'error'),
                    fc.constantFrom<LogLevel>('debug', 'info', 'warn', 'error'),
                    (minLevel, logLevel) => {
                        clearLogCache()
                        configureLog({ minLevel, enableConsole: false, enableStorage: false })

                        // 记录日志
                        switch (logLevel) {
                            case 'debug':
                                logService.debug('test')
                                break
                            case 'info':
                                logService.info('test')
                                break
                            case 'warn':
                                logService.warn('test')
                                break
                            case 'error':
                                logService.error('test')
                                break
                        }

                        const logs = getLogCache()
                        const shouldLog = levelPriority[logLevel] >= levelPriority[minLevel]

                        if (shouldLog) {
                            expect(logs.length).toBe(1)
                            expect(logs[0].level).toBe(logLevel)
                        } else {
                            expect(logs.length).toBe(0)
                        }
                    }
                ),
                { numRuns: 50 }
            )
        })
    })

    /**
     * 日志数据完整性测试
     */
    describe('日志数据完整性', () => {
        it('日志应包含时间戳', () => {
            fc.assert(
                fc.property(fc.string({ minLength: 1, maxLength: 100 }), (message) => {
                    clearLogCache()
                    const before = Date.now()

                    logService.info(message)

                    const after = Date.now()
                    const logs = getLogCache()

                    expect(logs.length).toBe(1)
                    expect(logs[0].timestamp).toBeGreaterThanOrEqual(before)
                    expect(logs[0].timestamp).toBeLessThanOrEqual(after)
                }),
                { numRuns: 30 }
            )
        })

        it('日志应正确保存附加数据', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 100 }),
                    fc.dictionary(
                        fc.string({ minLength: 1, maxLength: 20 }),
                        fc.oneof(fc.string(), fc.integer(), fc.boolean())
                    ),
                    (message, data) => {
                        clearLogCache()

                        logService.info(message, data)

                        const logs = getLogCache()
                        expect(logs.length).toBe(1)

                        if (Object.keys(data).length > 0) {
                            expect(logs[0].data).toEqual(data)
                        }
                    }
                ),
                { numRuns: 30 }
            )
        })
    })

    /**
     * 日志获取测试
     */
    describe('日志获取', () => {
        it('getRecentLogs应返回指定数量的日志', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 1, max: 20 }),
                    fc.integer({ min: 1, max: 50 }),
                    (logCount, requestCount) => {
                        clearLogCache()

                        // 添加日志
                        for (let i = 0; i < logCount; i++) {
                            logService.info(`Log ${i}`)
                        }

                        const logs = logService.getRecentLogs(requestCount)
                        const expectedCount = Math.min(logCount, requestCount)

                        expect(logs.length).toBe(expectedCount)
                    }
                ),
                { numRuns: 30 }
            )
        })

        it('getRecentLogs应返回最新的日志', () => {
            fc.assert(
                fc.property(fc.integer({ min: 5, max: 20 }), (logCount) => {
                    clearLogCache()

                    // 添加日志
                    for (let i = 0; i < logCount; i++) {
                        logService.info(`Log ${i}`)
                    }

                    const logs = logService.getRecentLogs(3)

                    // 验证返回的是最后3条
                    expect(logs.length).toBe(3)
                    expect(logs[0].message).toBe(`Log ${logCount - 3}`)
                    expect(logs[1].message).toBe(`Log ${logCount - 2}`)
                    expect(logs[2].message).toBe(`Log ${logCount - 1}`)
                }),
                { numRuns: 20 }
            )
        })
    })

    /**
     * 日志清除测试
     */
    describe('日志清除', () => {
        it('clearLogs应清除所有日志', () => {
            fc.assert(
                fc.property(fc.integer({ min: 1, max: 20 }), (logCount) => {
                    clearLogCache()

                    // 添加日志
                    for (let i = 0; i < logCount; i++) {
                        logService.info(`Log ${i}`)
                    }

                    expect(getLogCache().length).toBe(logCount)

                    logService.clearLogs()

                    expect(getLogCache().length).toBe(0)
                }),
                { numRuns: 20 }
            )
        })
    })

    /**
     * 多级别日志测试
     */
    describe('多级别日志', () => {
        it('所有日志级别应正确记录', () => {
            clearLogCache()
            configureLog({ minLevel: 'debug', enableConsole: false, enableStorage: false })

            logService.debug('debug message')
            logService.info('info message')
            logService.warn('warn message')
            logService.error('error message')

            const logs = getLogCache()
            expect(logs.length).toBe(4)
            expect(logs[0].level).toBe('debug')
            expect(logs[1].level).toBe('info')
            expect(logs[2].level).toBe('warn')
            expect(logs[3].level).toBe('error')
        })
    })
})
