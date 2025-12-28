/**
 * 设备状态组合式函数
 * 实现设备状态实时展示
 */
import { ref, computed, onUnmounted } from 'vue'
import type { Equipment, EquipmentStatus } from '@/types/business'

/** 设备状态统计 */
export interface EquipmentStats {
    /** 总数 */
    total: number
    /** 运行中 */
    running: number
    /** 空闲 */
    idle: number
    /** 维护中 */
    maintenance: number
    /** 故障 */
    fault: number
    /** 离线 */
    offline: number
    /** 运行率 */
    runningRate: number
    /** 可用率 */
    availableRate: number
}

/** 设备告警 */
export interface EquipmentAlarm {
    /** 告警ID */
    id: string
    /** 设备ID */
    equipmentId: string
    /** 设备名称 */
    equipmentName: string
    /** 告警类型 */
    type: 'warning' | 'error' | 'critical'
    /** 告警内容 */
    message: string
    /** 告警时间 */
    timestamp: number
    /** 是否已确认 */
    acknowledged: boolean
}

/** useEquipment 配置选项 */
export interface UseEquipmentOptions {
    /** 刷新间隔（毫秒） */
    refreshInterval?: number
    /** 加载设备列表回调 */
    onLoadEquipments?: () => Promise<Equipment[]>
    /** 加载设备详情回调 */
    onLoadEquipmentDetail?: (equipmentId: string) => Promise<Equipment | null>
    /** 加载告警列表回调 */
    onLoadAlarms?: () => Promise<EquipmentAlarm[]>
    /** 确认告警回调 */
    onAcknowledgeAlarm?: (alarmId: string) => Promise<boolean>
}

/**
 * 设备状态组合式函数
 */
export function useEquipment(options: UseEquipmentOptions = {}) {
    const {
        refreshInterval = 30000,
        onLoadEquipments,
        onLoadEquipmentDetail,
        onLoadAlarms,
        onAcknowledgeAlarm,
    } = options

    // 设备列表
    const equipments = ref<Equipment[]>([])

    // 当前选中的设备
    const currentEquipment = ref<Equipment | null>(null)

    // 告警列表
    const alarms = ref<EquipmentAlarm[]>([])

    // 加载状态
    const loading = ref(false)

    // 错误信息
    const errorMessage = ref<string | null>(null)

    // 自动刷新定时器
    let refreshTimer: ReturnType<typeof setInterval> | null = null

    // 计算属性：设备统计
    const stats = computed<EquipmentStats>(() => {
        const list = equipments.value
        const total = list.length
        const running = list.filter((e) => e.status === 'running').length
        const idle = list.filter((e) => e.status === 'idle').length
        const maintenance = list.filter((e) => e.status === 'maintenance').length
        const fault = list.filter((e) => e.status === 'fault').length
        const offline = list.filter((e) => e.status === 'offline').length

        return {
            total,
            running,
            idle,
            maintenance,
            fault,
            offline,
            runningRate: total > 0 ? Math.round((running / total) * 100) : 0,
            availableRate: total > 0 ? Math.round(((running + idle) / total) * 100) : 0,
        }
    })

    // 计算属性：未确认告警数
    const unacknowledgedAlarmCount = computed(() => {
        return alarms.value.filter((a) => !a.acknowledged).length
    })

    // 计算属性：按状态分组的设备
    const equipmentsByStatus = computed(() => {
        const groups: Record<EquipmentStatus, Equipment[]> = {
            running: [],
            idle: [],
            maintenance: [],
            fault: [],
            offline: [],
        }

        equipments.value.forEach((e) => {
            groups[e.status].push(e)
        })

        return groups
    })

    // 计算属性：故障设备列表
    const faultEquipments = computed(() => {
        return equipments.value.filter((e) => e.status === 'fault')
    })

    /**
     * 加载设备列表
     */
    const loadEquipments = async (): Promise<boolean> => {
        loading.value = true
        errorMessage.value = null

        try {
            if (onLoadEquipments) {
                equipments.value = await onLoadEquipments()
            } else {
                // 模拟数据
                equipments.value = [
                    {
                        id: '1',
                        code: 'EQ001',
                        name: 'CNC加工中心1',
                        type: 'CNC',
                        status: 'running',
                        workCenter: 'WC01',
                        currentWorkOrder: 'WO20231201001',
                        parameters: { speed: 1200, temperature: 45 },
                        lastUpdateTime: new Date().toISOString(),
                    },
                    {
                        id: '2',
                        code: 'EQ002',
                        name: 'CNC加工中心2',
                        type: 'CNC',
                        status: 'idle',
                        workCenter: 'WC01',
                        lastUpdateTime: new Date().toISOString(),
                    },
                    {
                        id: '3',
                        code: 'EQ003',
                        name: '注塑机1',
                        type: 'INJECTION',
                        status: 'maintenance',
                        workCenter: 'WC02',
                        lastUpdateTime: new Date().toISOString(),
                    },
                ]
            }

            loading.value = false
            return true
        } catch (e) {
            errorMessage.value = e instanceof Error ? e.message : '加载设备列表失败'
            loading.value = false
            return false
        }
    }

    /**
     * 加载设备详情
     */
    const loadEquipmentDetail = async (equipmentId: string): Promise<Equipment | null> => {
        loading.value = true
        errorMessage.value = null

        try {
            let equipment: Equipment | null = null

            if (onLoadEquipmentDetail) {
                equipment = await onLoadEquipmentDetail(equipmentId)
            } else {
                // 从列表中查找
                equipment = equipments.value.find((e) => e.id === equipmentId) || null
            }

            if (equipment) {
                currentEquipment.value = equipment
            }

            loading.value = false
            return equipment
        } catch (e) {
            errorMessage.value = e instanceof Error ? e.message : '加载设备详情失败'
            loading.value = false
            return null
        }
    }

    /**
     * 加载告警列表
     */
    const loadAlarms = async (): Promise<boolean> => {
        try {
            if (onLoadAlarms) {
                alarms.value = await onLoadAlarms()
            } else {
                // 模拟数据
                alarms.value = [
                    {
                        id: 'A001',
                        equipmentId: '3',
                        equipmentName: '注塑机1',
                        type: 'warning',
                        message: '设备温度过高',
                        timestamp: Date.now() - 3600000,
                        acknowledged: false,
                    },
                ]
            }
            return true
        } catch (e) {
            errorMessage.value = e instanceof Error ? e.message : '加载告警列表失败'
            return false
        }
    }

    /**
     * 确认告警
     */
    const acknowledgeAlarm = async (alarmId: string): Promise<boolean> => {
        try {
            let success = true

            if (onAcknowledgeAlarm) {
                success = await onAcknowledgeAlarm(alarmId)
            }

            if (success) {
                const alarm = alarms.value.find((a) => a.id === alarmId)
                if (alarm) {
                    alarm.acknowledged = true
                }
            }

            return success
        } catch (e) {
            errorMessage.value = e instanceof Error ? e.message : '确认告警失败'
            return false
        }
    }

    /**
     * 按状态筛选设备
     */
    const filterByStatus = (status: EquipmentStatus | 'all'): Equipment[] => {
        if (status === 'all') {
            return equipments.value
        }
        return equipments.value.filter((e) => e.status === status)
    }

    /**
     * 按类型筛选设备
     */
    const filterByType = (type: string): Equipment[] => {
        return equipments.value.filter((e) => e.type === type)
    }

    /**
     * 搜索设备
     */
    const searchEquipments = (keyword: string): Equipment[] => {
        const lowerKeyword = keyword.toLowerCase()
        return equipments.value.filter(
            (e) =>
                e.code.toLowerCase().includes(lowerKeyword) ||
                e.name.toLowerCase().includes(lowerKeyword) ||
                e.type.toLowerCase().includes(lowerKeyword)
        )
    }

    /**
     * 开始自动刷新
     */
    const startAutoRefresh = () => {
        if (refreshTimer) {
            return
        }

        refreshTimer = setInterval(() => {
            loadEquipments()
            loadAlarms()
        }, refreshInterval)
    }

    /**
     * 停止自动刷新
     */
    const stopAutoRefresh = () => {
        if (refreshTimer) {
            clearInterval(refreshTimer)
            refreshTimer = null
        }
    }

    /**
     * 刷新数据
     */
    const refresh = async () => {
        await Promise.all([loadEquipments(), loadAlarms()])
    }

    // 组件卸载时停止自动刷新
    onUnmounted(() => {
        stopAutoRefresh()
    })

    return {
        // 状态
        equipments,
        currentEquipment,
        alarms,
        loading,
        errorMessage,

        // 计算属性
        stats,
        unacknowledgedAlarmCount,
        equipmentsByStatus,
        faultEquipments,

        // 方法
        loadEquipments,
        loadEquipmentDetail,
        loadAlarms,
        acknowledgeAlarm,
        filterByStatus,
        filterByType,
        searchEquipments,
        startAutoRefresh,
        stopAutoRefresh,
        refresh,
    }
}
