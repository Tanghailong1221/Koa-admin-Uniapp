/**
 * 存储服务属性测试
 * **Feature: mes-wms-mobile-framework, Property 8: 状态持久化往返一致性**
 */
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { serialize, deserialize } from '@/services/storage'

describe('存储服务属性测试', () => {
    /**
     * **Feature: mes-wms-mobile-framework, Property 8: 状态持久化往返一致性**
     * **验证: 需求 6.2, 6.3**
     * 
     * 对于任意可序列化的应用状态对象，
     * 执行serialize然后deserialize后，得到的对象应与原对象深度相等
     */
    describe('属性8: 状态持久化往返一致性', () => {
        it('字符串往返应保持一致', () => {
            fc.assert(
                fc.property(
                    fc.string(),
                    (value) => {
                        const serialized = serialize(value)
                        const deserialized = deserialize<string>(serialized)

                        expect(deserialized).toBe(value)
                    }
                ),
                { numRuns: 100 }
            )
        })

        it('数字往返应保持一致', () => {
            fc.assert(
                fc.property(
                    fc.oneof(
                        fc.integer(),
                        fc.float({ noNaN: true, noDefaultInfinity: true }),
                    ),
                    (value) => {
                        const serialized = serialize(value)
                        const deserialized = deserialize<number>(serialized)

                        // JSON序列化会将-0转换为0，这是预期行为
                        if (Object.is(value, -0)) {
                            expect(deserialized).toBe(0)
                        } else {
                            expect(deserialized).toBe(value)
                        }
                    }
                ),
                { numRuns: 100 }
            )
        })

        it('布尔值往返应保持一致', () => {
            fc.assert(
                fc.property(
                    fc.boolean(),
                    (value) => {
                        const serialized = serialize(value)
                        const deserialized = deserialize<boolean>(serialized)

                        expect(deserialized).toBe(value)
                    }
                ),
                { numRuns: 100 }
            )
        })

        it('数组往返应保持一致', () => {
            fc.assert(
                fc.property(
                    fc.array(fc.oneof(fc.string(), fc.integer(), fc.boolean())),
                    (value) => {
                        const serialized = serialize(value)
                        const deserialized = deserialize<typeof value>(serialized)

                        expect(deserialized).toEqual(value)
                    }
                ),
                { numRuns: 100 }
            )
        })

        it('对象往返应保持一致', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        id: fc.string(),
                        name: fc.string(),
                        count: fc.integer(),
                        active: fc.boolean(),
                    }),
                    (value) => {
                        const serialized = serialize(value)
                        const deserialized = deserialize<typeof value>(serialized)

                        expect(deserialized).toEqual(value)
                    }
                ),
                { numRuns: 100 }
            )
        })

        it('嵌套对象往返应保持一致', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        user: fc.record({
                            id: fc.string(),
                            name: fc.string(),
                        }),
                        settings: fc.record({
                            theme: fc.constantFrom('light', 'dark'),
                            language: fc.string(),
                        }),
                        items: fc.array(fc.record({
                            id: fc.integer(),
                            value: fc.string(),
                        })),
                    }),
                    (value) => {
                        const serialized = serialize(value)
                        const deserialized = deserialize<typeof value>(serialized)

                        expect(deserialized).toEqual(value)
                    }
                ),
                { numRuns: 100 }
            )
        })

        it('null值往返应保持一致', () => {
            const serialized = serialize(null)
            const deserialized = deserialize<null>(serialized)

            expect(deserialized).toBeNull()
        })

        it('空对象往返应保持一致', () => {
            const value = {}
            const serialized = serialize(value)
            const deserialized = deserialize<typeof value>(serialized)

            expect(deserialized).toEqual(value)
        })

        it('空数组往返应保持一致', () => {
            const value: unknown[] = []
            const serialized = serialize(value)
            const deserialized = deserialize<typeof value>(serialized)

            expect(deserialized).toEqual(value)
        })

        it('复杂业务对象往返应保持一致', () => {
            fc.assert(
                fc.property(
                    // 模拟用户信息对象
                    fc.record({
                        id: fc.string(),
                        username: fc.string(),
                        realName: fc.string(),
                        roles: fc.array(fc.string()),
                        permissions: fc.array(fc.string()),
                        token: fc.string(),
                        refreshToken: fc.string(),
                        tokenExpireTime: fc.integer({ min: 0 }),
                    }),
                    (userInfo) => {
                        const serialized = serialize(userInfo)
                        const deserialized = deserialize<typeof userInfo>(serialized)

                        expect(deserialized).toEqual(userInfo)
                    }
                ),
                { numRuns: 100 }
            )
        })

        it('序列化应该是确定性的', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        id: fc.string(),
                        value: fc.integer(),
                    }),
                    (value) => {
                        // 相同输入应该产生相同输出（除了时间戳）
                        const serialized1 = serialize(value)
                        const serialized2 = serialize(value)

                        // 解析后数据部分应该相同
                        const parsed1 = JSON.parse(serialized1)
                        const parsed2 = JSON.parse(serialized2)

                        expect(parsed1.data).toEqual(parsed2.data)
                    }
                ),
                { numRuns: 100 }
            )
        })

        it('反序列化无效JSON应返回null', () => {
            const invalidStrings = [
                'not json',
                '{invalid}',
                '',
                'undefined',
            ]

            invalidStrings.forEach(str => {
                const result = deserialize(str)
                expect(result).toBeNull()
            })
        })
    })
})
