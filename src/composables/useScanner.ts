/**
 * 扫码业务处理组合式函数
 * 实现条码/二维码解析和业务数据关联
 */
import { ref, computed } from 'vue'
import type { ScanResult } from '@/types/business'

/** 条码类型 */
export type BarcodeType =
    | 'material' // 物料码
    | 'location' // 库位码
    | 'workorder' // 工单码
    | 'equipment' // 设备码
    | 'batch' // 批次码
    | 'serial' // 序列号
    | 'unknown' // 未知类型

/** 解析后的条码数据 */
export interface ParsedBarcode {
    /** 原始内容 */
    raw: string
    /** 条码类型 */
    type: BarcodeType
    /** 解析后的数据 */
    data: Record<string, unknown>
    /** 是否有效 */
    valid: boolean
    /** 错误信息 */
    error?: string
}

/** 条码规则配置 */
export interface BarcodeRule {
    /** 规则名称 */
    name: string
    /** 条码类型 */
    type: BarcodeType
    /** 匹配正则 */
    pattern: RegExp
    /** 解析函数 */
    parser: (content: string, match: RegExpMatchArray) => Record<string, unknown>
}

/** 默认条码规则 */
const defaultRules: BarcodeRule[] = [
    {
        name: '物料码',
        type: 'material',
        pattern: /^M([A-Z0-9]{6,20})$/,
        parser: (_, match) => ({ materialCode: match[1] }),
    },
    {
        name: '库位码',
        type: 'location',
        pattern: /^L([A-Z0-9]{2})-([A-Z0-9]{2})-([A-Z0-9]{2})$/,
        parser: (_, match) => ({
            warehouseCode: match[1],
            areaCode: match[2],
            locationCode: match[3],
            fullCode: `${match[1]}-${match[2]}-${match[3]}`,
        }),
    },
    {
        name: '工单码',
        type: 'workorder',
        pattern: /^WO(\d{8})(\d{4})$/,
        parser: (_, match) => ({
            date: match[1],
            sequence: match[2],
            orderNo: `WO${match[1]}${match[2]}`,
        }),
    },
    {
        name: '设备码',
        type: 'equipment',
        pattern: /^EQ([A-Z]{2})(\d{6})$/,
        parser: (_, match) => ({
            equipmentType: match[1],
            equipmentNo: match[2],
            equipmentCode: `EQ${match[1]}${match[2]}`,
        }),
    },
    {
        name: '批次码',
        type: 'batch',
        pattern: /^BT(\d{8})([A-Z0-9]{4})$/,
        parser: (_, match) => ({
            productionDate: match[1],
            batchSeq: match[2],
            batchNo: `BT${match[1]}${match[2]}`,
        }),
    },
    {
        name: '序列号',
        type: 'serial',
        pattern: /^SN([A-Z0-9]{16,32})$/,
        parser: (_, match) => ({ serialNo: match[1] }),
    },
]

/** useScanner 配置选项 */
export interface UseScannerOptions {
    /** 自定义条码规则 */
    rules?: BarcodeRule[]
    /** 是否追加到默认规则 */
    appendRules?: boolean
    /** 扫码历史记录数量限制 */
    historyLimit?: number
    /** 扫码成功回调 */
    onSuccess?: (result: ParsedBarcode) => void
    /** 扫码失败回调 */
    onError?: (error: string) => void
}

/**
 * 扫码业务处理组合式函数
 */
export function useScanner(options: UseScannerOptions = {}) {
    const { rules = [], appendRules = true, historyLimit = 50, onSuccess, onError } = options

    // 合并规则
    const barcodeRules = appendRules ? [...defaultRules, ...rules] : rules

    // 扫码历史
    const scanHistory = ref<ScanResult[]>([])

    // 最后一次扫码结果
    const lastScanResult = ref<ParsedBarcode | null>(null)

    // 是否正在扫码
    const isScanning = ref(false)

    // 扫码错误信息
    const scanError = ref<string | null>(null)

    // 历史记录数量
    const historyCount = computed(() => scanHistory.value.length)

    /**
     * 解析条码内容
     */
    const parseBarcode = (content: string): ParsedBarcode => {
        const trimmedContent = content.trim()

        if (!trimmedContent) {
            return {
                raw: content,
                type: 'unknown',
                data: {},
                valid: false,
                error: '条码内容为空',
            }
        }

        // 尝试匹配规则
        for (const rule of barcodeRules) {
            const match = trimmedContent.match(rule.pattern)
            if (match) {
                try {
                    const data = rule.parser(trimmedContent, match)
                    return {
                        raw: trimmedContent,
                        type: rule.type,
                        data,
                        valid: true,
                    }
                } catch (e) {
                    return {
                        raw: trimmedContent,
                        type: rule.type,
                        data: {},
                        valid: false,
                        error: `解析失败: ${e instanceof Error ? e.message : '未知错误'}`,
                    }
                }
            }
        }

        // 未匹配任何规则，返回原始内容
        return {
            raw: trimmedContent,
            type: 'unknown',
            data: { content: trimmedContent },
            valid: true,
        }
    }

    /**
     * 处理扫码结果
     */
    const handleScan = (scanResult: ScanResult): ParsedBarcode => {
        isScanning.value = false
        scanError.value = null

        // 解析条码
        const parsed = parseBarcode(scanResult.content)

        // 更新最后扫码结果
        lastScanResult.value = parsed

        // 添加到历史记录
        scanHistory.value.unshift(scanResult)

        // 限制历史记录数量
        if (scanHistory.value.length > historyLimit) {
            scanHistory.value = scanHistory.value.slice(0, historyLimit)
        }

        // 触发回调
        if (parsed.valid) {
            onSuccess?.(parsed)
        } else {
            scanError.value = parsed.error || '扫码失败'
            onError?.(scanError.value)
        }

        return parsed
    }

    /**
     * 手动输入条码
     */
    const inputBarcode = (content: string): ParsedBarcode => {
        const scanResult: ScanResult = {
            type: 'barcode',
            content,
            format: 'manual',
            timestamp: Date.now(),
            businessType: 'manual_input',
        }
        return handleScan(scanResult)
    }

    /**
     * 开始扫码（调用设备扫码功能）
     */
    const startScan = async (): Promise<ParsedBarcode | null> => {
        if (isScanning.value) {
            return null
        }

        isScanning.value = true
        scanError.value = null

        try {
            // 调用 UniApp 扫码 API
            const result = await new Promise<UniApp.ScanCodeSuccessRes>((resolve, reject) => {
                uni.scanCode({
                    onlyFromCamera: false,
                    scanType: ['barCode', 'qrCode'],
                    success: resolve,
                    fail: reject,
                })
            })

            const scanResult: ScanResult = {
                type: result.scanType === 'QR_CODE' ? 'qrcode' : 'barcode',
                content: result.result,
                format: result.scanType || 'unknown',
                timestamp: Date.now(),
            }

            return handleScan(scanResult)
        } catch (e) {
            isScanning.value = false
            scanError.value = e instanceof Error ? e.message : '扫码失败'
            onError?.(scanError.value)
            return null
        }
    }

    /**
     * 清空扫码历史
     */
    const clearHistory = () => {
        scanHistory.value = []
    }

    /**
     * 获取指定类型的历史记录
     */
    const getHistoryByType = (type: BarcodeType): ScanResult[] => {
        return scanHistory.value.filter((item) => {
            const parsed = parseBarcode(item.content)
            return parsed.type === type
        })
    }

    /**
     * 验证条码格式
     */
    const validateBarcode = (content: string, expectedType?: BarcodeType): boolean => {
        const parsed = parseBarcode(content)
        if (!parsed.valid) {
            return false
        }
        if (expectedType && parsed.type !== expectedType) {
            return false
        }
        return true
    }

    return {
        // 状态
        scanHistory,
        lastScanResult,
        isScanning,
        scanError,
        historyCount,

        // 方法
        parseBarcode,
        handleScan,
        inputBarcode,
        startScan,
        clearHistory,
        getHistoryByType,
        validateBarcode,
    }
}
