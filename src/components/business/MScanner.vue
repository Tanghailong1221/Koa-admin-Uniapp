<template>
    <view class="m-scanner">
        <view class="m-scanner__input-wrapper">
            <input
                ref="inputRef"
                class="m-scanner__input"
                :value="inputValue"
                :placeholder="placeholder"
                :disabled="disabled"
                @input="handleInput"
                @confirm="handleConfirm"
                @focus="handleFocus"
                @blur="handleBlur"
            />
            <view v-if="inputValue && clearable" class="m-scanner__clear" @click="handleClear">
                <text class="m-icon-close"></text>
            </view>
            <view class="m-scanner__btn" @click="handleScanClick">
                <text class="m-icon-scan"></text>
            </view>
        </view>
        <view v-if="showHistory && history.length" class="m-scanner__history">
            <view class="m-scanner__history-header">
                <text>扫码历史</text>
                <text class="m-scanner__history-clear" @click="clearHistory">清空</text>
            </view>
            <view class="m-scanner__history-list">
                <view
                    v-for="(item, index) in history.slice(0, maxHistory)"
                    :key="index"
                    class="m-scanner__history-item"
                    @click="selectHistory(item)"
                >
                    <text>{{ item }}</text>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits, onMounted, onUnmounted } from 'vue'

export interface MScannerProps {
    /** 绑定值 */
    modelValue?: string
    /** 占位文本 */
    placeholder?: string
    /** 是否禁用 */
    disabled?: boolean
    /** 是否可清空 */
    clearable?: boolean
    /** 是否显示历史记录 */
    showHistory?: boolean
    /** 最大历史记录数 */
    maxHistory?: number
    /** 是否自动聚焦 */
    autoFocus?: boolean
    /** 扫码后是否自动清空 */
    autoClear?: boolean
    /** 是否监听硬件扫码 */
    listenHardware?: boolean
}

const props = withDefaults(defineProps<MScannerProps>(), {
    modelValue: '',
    placeholder: '扫码或输入条码',
    disabled: false,
    clearable: true,
    showHistory: false,
    maxHistory: 5,
    autoFocus: false,
    autoClear: false,
    listenHardware: true,
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
    (e: 'scan', value: string): void
    (e: 'input', value: string): void
    (e: 'clear'): void
    (e: 'focus'): void
    (e: 'blur'): void
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const inputValue = ref(props.modelValue)
const history = ref<string[]>([])
const isFocused = ref(false)

// 硬件扫码缓冲
let scanBuffer = ''
let scanTimer: ReturnType<typeof setTimeout> | null = null

const handleInput = (event: Event) => {
    const target = event.target as HTMLInputElement
    inputValue.value = target.value
    emit('update:modelValue', target.value)
    emit('input', target.value)
}

const handleConfirm = () => {
    if (inputValue.value) {
        processScanResult(inputValue.value)
    }
}

const handleFocus = () => {
    isFocused.value = true
    emit('focus')
}

const handleBlur = () => {
    isFocused.value = false
    emit('blur')
}

const handleClear = () => {
    inputValue.value = ''
    emit('update:modelValue', '')
    emit('clear')
}

const handleScanClick = () => {
    if (props.disabled) return

    // 调用摄像头扫码
    uni.scanCode({
        onlyFromCamera: false,
        scanType: ['barCode', 'qrCode'],
        success: (res) => {
            processScanResult(res.result)
        },
        fail: (err) => {
            console.error('扫码失败:', err)
            uni.showToast({
                title: '扫码失败',
                icon: 'none',
            })
        },
    })
}

const processScanResult = (value: string) => {
    if (!value) return

    // 添加到历史记录
    if (props.showHistory) {
        addToHistory(value)
    }

    // 触发扫码事件
    emit('scan', value)

    // 自动清空
    if (props.autoClear) {
        inputValue.value = ''
        emit('update:modelValue', '')
    } else {
        inputValue.value = value
        emit('update:modelValue', value)
    }
}

const addToHistory = (value: string) => {
    // 移除重复项
    const index = history.value.indexOf(value)
    if (index > -1) {
        history.value.splice(index, 1)
    }
    // 添加到开头
    history.value.unshift(value)
    // 限制数量
    if (history.value.length > props.maxHistory) {
        history.value = history.value.slice(0, props.maxHistory)
    }
    // 保存到本地
    saveHistory()
}

const selectHistory = (value: string) => {
    processScanResult(value)
}

const clearHistory = () => {
    history.value = []
    saveHistory()
}

const saveHistory = () => {
    try {
        uni.setStorageSync('scanner_history', history.value)
    } catch {
        // ignore
    }
}

const loadHistory = () => {
    try {
        const saved = uni.getStorageSync('scanner_history')
        if (Array.isArray(saved)) {
            history.value = saved
        }
    } catch {
        // ignore
    }
}

// 硬件扫码监听
const handleKeyDown = (event: KeyboardEvent) => {
    if (!props.listenHardware || props.disabled) return

    // 扫码枪通常快速输入字符，以回车结束
    if (event.key === 'Enter') {
        if (scanBuffer) {
            processScanResult(scanBuffer)
            scanBuffer = ''
        }
        return
    }

    // 只接受可打印字符
    if (event.key.length === 1) {
        scanBuffer += event.key

        // 重置定时器
        if (scanTimer) {
            clearTimeout(scanTimer)
        }
        // 100ms内没有新输入则清空缓冲
        scanTimer = setTimeout(() => {
            scanBuffer = ''
        }, 100)
    }
}

onMounted(() => {
    if (props.showHistory) {
        loadHistory()
    }

    if (props.autoFocus) {
        inputRef.value?.focus()
    }

    // 监听硬件扫码
    if (props.listenHardware) {
        document.addEventListener('keydown', handleKeyDown)
    }
})

onUnmounted(() => {
    if (props.listenHardware) {
        document.removeEventListener('keydown', handleKeyDown)
    }
    if (scanTimer) {
        clearTimeout(scanTimer)
    }
})
</script>

<style lang="scss" scoped>
.m-scanner {
    width: 100%;

    &__input-wrapper {
        display: flex;
        align-items: center;
        background-color: #fff;
        border: 1px solid #dcdfe6;
        border-radius: 8rpx;
        padding: 0 20rpx;
        height: 80rpx;
    }

    &__input {
        flex: 1;
        height: 100%;
        font-size: 28rpx;
        color: #303133;
        background: transparent;
        border: none;
        outline: none;

        &::placeholder {
            color: #c0c4cc;
        }
    }

    &__clear {
        padding: 8rpx;
        color: #c0c4cc;
        cursor: pointer;

        &:active {
            color: #909399;
        }
    }

    &__btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 60rpx;
        height: 60rpx;
        margin-left: 12rpx;
        background-color: #409eff;
        border-radius: 8rpx;
        color: #fff;
        font-size: 32rpx;
        cursor: pointer;

        &:active {
            background-color: #3a8ee6;
        }
    }

    &__history {
        margin-top: 16rpx;
        background-color: #fff;
        border-radius: 8rpx;
        overflow: hidden;

        &-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16rpx 20rpx;
            font-size: 24rpx;
            color: #909399;
            border-bottom: 1px solid #ebeef5;
        }

        &-clear {
            color: #409eff;
            cursor: pointer;
        }

        &-list {
            max-height: 300rpx;
            overflow-y: auto;
        }

        &-item {
            padding: 20rpx;
            font-size: 28rpx;
            color: #303133;
            border-bottom: 1px solid #ebeef5;
            cursor: pointer;

            &:last-child {
                border-bottom: none;
            }

            &:active {
                background-color: #f5f7fa;
            }
        }
    }
}
</style>
