/**
 * PDA专用功能组合式函数
 */
import { ref, onMounted, onUnmounted } from 'vue'
import type { ScanResult } from '@/types/business'

/** 扫码回调类型 */
type ScanCallback = (result: ScanResult) => void

/** 扫码回调列表 */
const scanCallbacks: ScanCallback[] = []

/** 扫码缓冲区 */
let scanBuffer = ''
let scanTimer: ReturnType<typeof setTimeout> | null = null

/** 扫码超时时间（毫秒） */
const SCAN_TIMEOUT = 100

/**
 * 处理扫码输入
 * PDA扫码枪通常模拟键盘输入，快速连续输入字符
 */
const handleScanInput = (char: string) => {
    // 清除之前的定时器
    if (scanTimer) {
        clearTimeout(scanTimer)
    }

    // 添加字符到缓冲区
    scanBuffer += char

    // 设置新的定时器，超时后处理扫码结果
    scanTimer = setTimeout(() => {
        if (scanBuffer.length > 0) {
            const result: ScanResult = {
                type: scanBuffer.includes('http') ? 'qrcode' : 'barcode',
                content: scanBuffer.trim(),
                format: 'unknown',
                timestamp: Date.now(),
            }

            // 通知所有回调
            scanCallbacks.forEach(callback => callback(result))

            // 清空缓冲区
            scanBuffer = ''
        }
    }, SCAN_TIMEOUT)
}

/**
 * 键盘事件处理器
 */
const keydownHandler = (event: KeyboardEvent) => {
    // 忽略功能键
    if (event.ctrlKey || event.altKey || event.metaKey) {
        return
    }

    // 回车键表示扫码结束
    if (event.key === 'Enter') {
        if (scanTimer) {
            clearTimeout(scanTimer)
            scanTimer = null
        }

        if (scanBuffer.length > 0) {
            const result: ScanResult = {
                type: scanBuffer.includes('http') ? 'qrcode' : 'barcode',
                content: scanBuffer.trim(),
                format: 'unknown',
                timestamp: Date.now(),
            }

            scanCallbacks.forEach(callback => callback(result))
            scanBuffer = ''
        }
        return
    }

    // 只处理可打印字符
    if (event.key.length === 1) {
        handleScanInput(event.key)
    }
}

/**
 * PDA专用功能组合式函数
 */
export function usePDA() {
    const isListening = ref(false)
    const lastScanResult = ref<ScanResult | null>(null)

    /**
     * 开始监听扫码
     */
    const startScanListener = () => {
        if (isListening.value) return

        // #ifdef H5
        document.addEventListener('keydown', keydownHandler)
        // #endif

        // #ifdef APP-PLUS
        // App端使用plus.key监听硬件按键
        try {
            plus.key.addEventListener('keydown', (event: any) => {
                // 扫码枪通常使用特定的keyCode
                if (event.keyCode >= 32 && event.keyCode <= 126) {
                    handleScanInput(String.fromCharCode(event.keyCode))
                } else if (event.keyCode === 13) {
                    // 回车键
                    if (scanBuffer.length > 0) {
                        const result: ScanResult = {
                            type: scanBuffer.includes('http') ? 'qrcode' : 'barcode',
                            content: scanBuffer.trim(),
                            format: 'unknown',
                            timestamp: Date.now(),
                        }
                        scanCallbacks.forEach(callback => callback(result))
                        scanBuffer = ''
                    }
                }
            })
        } catch {
            // ignore
        }
        // #endif

        isListening.value = true
    }

    /**
     * 停止监听扫码
     */
    const stopScanListener = () => {
        if (!isListening.value) return

        // #ifdef H5
        document.removeEventListener('keydown', keydownHandler)
        // #endif

        // #ifdef APP-PLUS
        try {
            plus.key.removeEventListener('keydown')
        } catch {
            // ignore
        }
        // #endif

        isListening.value = false
        scanBuffer = ''
        if (scanTimer) {
            clearTimeout(scanTimer)
            scanTimer = null
        }
    }

    /**
     * 注册扫码回调
     */
    const onScan = (callback: ScanCallback) => {
        scanCallbacks.push(callback)

        // 返回取消注册函数
        return () => {
            const index = scanCallbacks.indexOf(callback)
            if (index > -1) {
                scanCallbacks.splice(index, 1)
            }
        }
    }

    /**
     * 模拟扫码（用于测试）
     */
    const simulateScan = (content: string) => {
        const result: ScanResult = {
            type: content.includes('http') ? 'qrcode' : 'barcode',
            content,
            format: 'unknown',
            timestamp: Date.now(),
        }
        lastScanResult.value = result
        scanCallbacks.forEach(callback => callback(result))
    }

    /**
     * 触发硬件扫码（调用系统扫码）
     */
    const triggerHardwareScan = (): Promise<ScanResult> => {
        return new Promise((resolve, reject) => {
            // #ifdef APP-PLUS
            try {
                plus.barcode.scan(
                    undefined,
                    (type: number, result: string) => {
                        const scanResult: ScanResult = {
                            type: type === 0 ? 'qrcode' : 'barcode',
                            content: result,
                            format: String(type),
                            timestamp: Date.now(),
                        }
                        lastScanResult.value = scanResult
                        resolve(scanResult)
                    },
                    (error: any) => {
                        reject(new Error(error.message || '扫码失败'))
                    }
                )
            } catch (error) {
                reject(error)
            }
            // #endif

            // #ifndef APP-PLUS
            reject(new Error('当前平台不支持硬件扫码'))
            // #endif
        })
    }

    // 生命周期
    onMounted(() => {
        startScanListener()
    })

    onUnmounted(() => {
        stopScanListener()
    })

    return {
        isListening,
        lastScanResult,
        startScanListener,
        stopScanListener,
        onScan,
        simulateScan,
        triggerHardwareScan,
    }
}

export default usePDA
