/**
 * 库存操作组合式函数
 * 实现入库、出库、移库、盘点业务流程
 */
import { ref, computed, reactive } from 'vue'
import type { InventoryItem, InventoryOperation, InventoryOperationType, Location } from '@/types/business'

/** 库存操作表单 */
export interface InventoryOperationForm {
    /** 操作类型 */
    type: InventoryOperationType
    /** 物料编码 */
    materialCode: string
    /** 物料名称 */
    materialName: string
    /** 源库位 */
    fromLocation: string
    /** 目标库位 */
    toLocation: string
    /** 数量 */
    quantity: number
    /** 单位 */
    unit: string
    /** 批次号 */
    batchNo: string
    /** 单据号 */
    documentNo: string
    /** 备注 */
    remark: string
}

/** 盘点差异项 */
export interface StocktakeDiff {
    /** 物料编码 */
    materialCode: string
    /** 物料名称 */
    materialName: string
    /** 库位 */
    locationCode: string
    /** 系统数量 */
    systemQty: number
    /** 实盘数量 */
    actualQty: number
    /** 差异数量 */
    diffQty: number
    /** 差异原因 */
    reason?: string
}

/** 操作状态 */
export type OperationStatus = 'idle' | 'scanning' | 'confirming' | 'submitting' | 'success' | 'error'

/** useInventory 配置选项 */
export interface UseInventoryOptions {
    /** 提交操作回调 */
    onSubmit?: (operation: InventoryOperationForm) => Promise<boolean>
    /** 查询库存回调 */
    onQueryInventory?: (materialCode: string, locationCode?: string) => Promise<InventoryItem[]>
    /** 查询库位回调 */
    onQueryLocation?: (code: string) => Promise<Location | null>
    /** 提交盘点回调 */
    onSubmitStocktake?: (diffs: StocktakeDiff[]) => Promise<boolean>
}

/**
 * 库存操作组合式函数
 */
export function useInventory(options: UseInventoryOptions = {}) {
    const { onSubmit, onQueryInventory, onQueryLocation, onSubmitStocktake } = options

    // 当前状态
    const status = ref<OperationStatus>('idle')

    // 当前操作类型
    const operationType = ref<InventoryOperationType>('inbound')

    // 操作表单
    const operationForm = reactive<InventoryOperationForm>({
        type: 'inbound',
        materialCode: '',
        materialName: '',
        fromLocation: '',
        toLocation: '',
        quantity: 0,
        unit: '',
        batchNo: '',
        documentNo: '',
        remark: '',
    })

    // 当前库存列表
    const inventoryList = ref<InventoryItem[]>([])

    // 选中的库存项
    const selectedInventory = ref<InventoryItem | null>(null)

    // 盘点差异列表
    const stocktakeDiffs = ref<StocktakeDiff[]>([])

    // 操作历史
    const operationHistory = ref<InventoryOperation[]>([])

    // 错误信息
    const errorMessage = ref<string | null>(null)

    // 计算属性：是否可以提交
    const canSubmit = computed(() => {
        const form = operationForm
        if (!form.materialCode || form.quantity <= 0) {
            return false
        }

        switch (form.type) {
            case 'inbound':
                return !!form.toLocation
            case 'outbound':
                return !!form.fromLocation
            case 'transfer':
                return !!form.fromLocation && !!form.toLocation && form.fromLocation !== form.toLocation
            case 'stocktake':
                return stocktakeDiffs.value.length > 0
            case 'adjust':
                return !!form.toLocation
            default:
                return false
        }
    })

    // 计算属性：盘点差异汇总
    const stocktakeSummary = computed(() => {
        const diffs = stocktakeDiffs.value
        return {
            totalItems: diffs.length,
            profitItems: diffs.filter((d) => d.diffQty > 0).length,
            lossItems: diffs.filter((d) => d.diffQty < 0).length,
            totalProfit: diffs.filter((d) => d.diffQty > 0).reduce((sum, d) => sum + d.diffQty, 0),
            totalLoss: Math.abs(diffs.filter((d) => d.diffQty < 0).reduce((sum, d) => sum + d.diffQty, 0)),
        }
    })

    /**
     * 设置操作类型
     */
    const setOperationType = (type: InventoryOperationType) => {
        operationType.value = type
        operationForm.type = type
        resetForm()
    }

    /**
     * 扫描物料
     */
    const scanMaterial = async (materialCode: string): Promise<boolean> => {
        status.value = 'scanning'
        errorMessage.value = null

        try {
            operationForm.materialCode = materialCode

            // 查询库存
            if (onQueryInventory) {
                inventoryList.value = await onQueryInventory(materialCode)
            } else {
                // 模拟数据
                inventoryList.value = [
                    {
                        id: '1',
                        materialCode,
                        materialName: `物料${materialCode}`,
                        locationCode: 'A01-01-01',
                        locationName: 'A区1排1层',
                        quantity: 100,
                        unit: '个',
                        batchNo: 'BT20231201001',
                    },
                ]
            }

            if (inventoryList.value.length > 0) {
                const first = inventoryList.value[0]
                operationForm.materialName = first.materialName
                operationForm.unit = first.unit
            }

            status.value = 'confirming'
            return true
        } catch (e) {
            errorMessage.value = e instanceof Error ? e.message : '扫描物料失败'
            status.value = 'error'
            return false
        }
    }

    /**
     * 扫描库位
     */
    const scanLocation = async (locationCode: string, isSource: boolean = false): Promise<boolean> => {
        try {
            let location: Location | null = null

            if (onQueryLocation) {
                location = await onQueryLocation(locationCode)
            } else {
                // 模拟数据
                location = {
                    id: locationCode,
                    code: locationCode,
                    name: `库位${locationCode}`,
                    warehouseId: 'W01',
                    warehouseName: '主仓库',
                    enabled: true,
                }
            }

            if (!location) {
                errorMessage.value = '库位不存在'
                return false
            }

            if (!location.enabled) {
                errorMessage.value = '库位已禁用'
                return false
            }

            if (isSource) {
                operationForm.fromLocation = locationCode
            } else {
                operationForm.toLocation = locationCode
            }

            return true
        } catch (e) {
            errorMessage.value = e instanceof Error ? e.message : '扫描库位失败'
            return false
        }
    }

    /**
     * 选择库存项
     */
    const selectInventoryItem = (item: InventoryItem) => {
        selectedInventory.value = item
        operationForm.materialCode = item.materialCode
        operationForm.materialName = item.materialName
        operationForm.fromLocation = item.locationCode
        operationForm.unit = item.unit
        operationForm.batchNo = item.batchNo || ''
    }

    /**
     * 更新数量
     */
    const updateQuantity = (quantity: number) => {
        operationForm.quantity = Math.max(0, quantity)
    }

    /**
     * 添加盘点差异
     */
    const addStocktakeDiff = (item: InventoryItem, actualQty: number, reason?: string) => {
        const diffQty = actualQty - item.quantity
        if (diffQty === 0) {
            return
        }

        const existingIndex = stocktakeDiffs.value.findIndex(
            (d) => d.materialCode === item.materialCode && d.locationCode === item.locationCode
        )

        const diff: StocktakeDiff = {
            materialCode: item.materialCode,
            materialName: item.materialName,
            locationCode: item.locationCode,
            systemQty: item.quantity,
            actualQty,
            diffQty,
            reason,
        }

        if (existingIndex >= 0) {
            stocktakeDiffs.value[existingIndex] = diff
        } else {
            stocktakeDiffs.value.push(diff)
        }
    }

    /**
     * 移除盘点差异
     */
    const removeStocktakeDiff = (materialCode: string, locationCode: string) => {
        stocktakeDiffs.value = stocktakeDiffs.value.filter(
            (d) => !(d.materialCode === materialCode && d.locationCode === locationCode)
        )
    }

    /**
     * 提交操作
     */
    const submitOperation = async (): Promise<boolean> => {
        if (!canSubmit.value) {
            errorMessage.value = '请完善操作信息'
            return false
        }

        status.value = 'submitting'
        errorMessage.value = null

        try {
            let success = true

            if (operationForm.type === 'stocktake') {
                // 提交盘点
                if (onSubmitStocktake) {
                    success = await onSubmitStocktake(stocktakeDiffs.value)
                }
            } else {
                // 提交其他操作
                if (onSubmit) {
                    success = await onSubmit(operationForm)
                }
            }

            if (success) {
                // 添加到历史记录
                const operation: InventoryOperation = {
                    id: `OP${Date.now()}`,
                    type: operationForm.type,
                    materialCode: operationForm.materialCode,
                    materialName: operationForm.materialName,
                    fromLocation: operationForm.fromLocation || undefined,
                    toLocation: operationForm.toLocation || undefined,
                    quantity: operationForm.quantity,
                    unit: operationForm.unit,
                    batchNo: operationForm.batchNo || undefined,
                    operator: '当前用户',
                    operationTime: new Date().toISOString(),
                    documentNo: operationForm.documentNo || undefined,
                    remark: operationForm.remark || undefined,
                }
                operationHistory.value.unshift(operation)

                status.value = 'success'
                return true
            } else {
                throw new Error('提交失败')
            }
        } catch (e) {
            errorMessage.value = e instanceof Error ? e.message : '提交操作失败'
            status.value = 'error'
            return false
        }
    }

    /**
     * 重置表单
     */
    const resetForm = () => {
        operationForm.materialCode = ''
        operationForm.materialName = ''
        operationForm.fromLocation = ''
        operationForm.toLocation = ''
        operationForm.quantity = 0
        operationForm.unit = ''
        operationForm.batchNo = ''
        operationForm.documentNo = ''
        operationForm.remark = ''
        inventoryList.value = []
        selectedInventory.value = null
        stocktakeDiffs.value = []
        status.value = 'idle'
        errorMessage.value = null
    }

    return {
        // 状态
        status,
        operationType,
        operationForm,
        inventoryList,
        selectedInventory,
        stocktakeDiffs,
        operationHistory,
        errorMessage,

        // 计算属性
        canSubmit,
        stocktakeSummary,

        // 方法
        setOperationType,
        scanMaterial,
        scanLocation,
        selectInventoryItem,
        updateQuantity,
        addStocktakeDiff,
        removeStocktakeDiff,
        submitOperation,
        resetForm,
    }
}
