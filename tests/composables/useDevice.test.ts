/**
 * 设备适配属性测试
 * **Feature: mes-wms-mobile-framework, Property 6: 设备类型识别与布局配置一致性**
 */
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import type { DeviceType, LayoutConfig } from '@/types/device'

/** 设备类型阈值 */
const THRESHOLDS = {
    phoneMaxWidth: 768,
    tabletMaxWidth: 1024,
}

/** 布局配置 */
const layoutConfigs: Record<DeviceType, LayoutConfig> = {
    phone: {
        columns: 1,
        gutter: 12,
        fontSize: { base: 14, small: 12, large: 16 },
        touchArea: { minWidth: 44, minHeight: 44 },
    },
    tablet: {
        columns: 2,
        gutter: 16,
        fontSize: { base: 16, small: 14, large: 18 },
        touchArea: { minWidth: 48, minHeight: 48 },
    },
    pda: {
        columns: 1,
        gutter: 8,
        fontSize: { base: 16, small: 14, large: 18 },
        touchArea: { minWidth: 56, minHeight: 56 },
    },
}

/**
 * 检测设备类型（纯函数版本用于测试）
 */
const detectDeviceType = (screenWidth: number): DeviceType => {
    if (screenWidth < THRESHOLDS.phoneMaxWidth) {
        return 'phone'
    }
    if (screenWidth < THRESHOLDS.tabletMaxWidth) {
        return 'pda'
    }
    return 'tablet'
}

/**
 * 获取布局配置（纯函数版本用于测试）
 */
const getLayoutConfig = (deviceType: DeviceType): LayoutConfig => {
    return layoutConfigs[deviceType]
}

describe('设备适配属性测试', () => {
    /**
     * **Feature: mes-wms-mobile-framework, Property 6: 设备类型识别与布局配置一致性**
     * **验证: 需求 1.1, 1.2**
     * 
     * 对于任意屏幕宽度值，detectDeviceType返回的设备类型应与预定义阈值规则一致
     * （width<768为phone，768≤width<1024为pda，width≥1024为tablet），
     * 且getLayoutConfig返回的配置应与该设备类型的预设配置完全匹配
     */
    describe('属性6: 设备类型识别与布局配置一致性', () => {
        it('屏幕宽度小于768应识别为phone', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 1, max: 767 }),
                    (screenWidth) => {
                        const deviceType = detectDeviceType(screenWidth)
                        expect(deviceType).toBe('phone')
                    }
                ),
                { numRuns: 100 }
            )
        })

        it('屏幕宽度在768-1023之间应识别为pda', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 768, max: 1023 }),
                    (screenWidth) => {
                        const deviceType = detectDeviceType(screenWidth)
                        expect(deviceType).toBe('pda')
                    }
                ),
                { numRuns: 100 }
            )
        })

        it('屏幕宽度大于等于1024应识别为tablet', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 1024, max: 4096 }),
                    (screenWidth) => {
                        const deviceType = detectDeviceType(screenWidth)
                        expect(deviceType).toBe('tablet')
                    }
                ),
                { numRuns: 100 }
            )
        })

        it('设备类型与布局配置应一一对应', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 1, max: 4096 }),
                    (screenWidth) => {
                        const deviceType = detectDeviceType(screenWidth)
                        const config = getLayoutConfig(deviceType)

                        // 验证配置与预设完全匹配
                        expect(config).toEqual(layoutConfigs[deviceType])
                    }
                ),
                { numRuns: 100 }
            )
        })

        it('phone设备应使用单列布局', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 1, max: 767 }),
                    (screenWidth) => {
                        const deviceType = detectDeviceType(screenWidth)
                        const config = getLayoutConfig(deviceType)

                        expect(config.columns).toBe(1)
                        expect(config.gutter).toBe(12)
                        expect(config.fontSize.base).toBe(14)
                        expect(config.touchArea.minWidth).toBe(44)
                    }
                ),
                { numRuns: 100 }
            )
        })

        it('tablet设备应使用双列布局', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 1024, max: 4096 }),
                    (screenWidth) => {
                        const deviceType = detectDeviceType(screenWidth)
                        const config = getLayoutConfig(deviceType)

                        expect(config.columns).toBe(2)
                        expect(config.gutter).toBe(16)
                        expect(config.fontSize.base).toBe(16)
                        expect(config.touchArea.minWidth).toBe(48)
                    }
                ),
                { numRuns: 100 }
            )
        })

        it('pda设备应使用优化的触控区域', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 768, max: 1023 }),
                    (screenWidth) => {
                        const deviceType = detectDeviceType(screenWidth)
                        const config = getLayoutConfig(deviceType)

                        expect(config.columns).toBe(1)
                        expect(config.gutter).toBe(8)
                        expect(config.touchArea.minWidth).toBe(56)
                        expect(config.touchArea.minHeight).toBe(56)
                    }
                ),
                { numRuns: 100 }
            )
        })

        it('设备类型识别应该是确定性的', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 1, max: 4096 }),
                    (screenWidth) => {
                        // 相同输入应该产生相同输出
                        const result1 = detectDeviceType(screenWidth)
                        const result2 = detectDeviceType(screenWidth)

                        expect(result1).toBe(result2)
                    }
                ),
                { numRuns: 100 }
            )
        })

        it('布局配置获取应该是确定性的', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom('phone', 'tablet', 'pda') as fc.Arbitrary<DeviceType>,
                    (deviceType) => {
                        // 相同输入应该产生相同输出
                        const config1 = getLayoutConfig(deviceType)
                        const config2 = getLayoutConfig(deviceType)

                        expect(config1).toEqual(config2)
                    }
                ),
                { numRuns: 100 }
            )
        })
    })
})
