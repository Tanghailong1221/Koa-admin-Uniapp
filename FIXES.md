# 问题修复总结

## 已解决的问题

### 1. Vue 3 编译器宏警告

**问题描述：**
```
[@vue/compiler-sfc] `defineProps` is a compiler macro and no longer needs to be imported.
[@vue/compiler-sfc] `defineEmits` is a compiler macro and no longer needs to be imported.
```

**原因：**
在 Vue 3 的 `<script setup>` 中，`defineProps` 和 `defineEmits` 是编译器宏，不需要显式导入。

**修复方案：**
从以下文件中移除了不必要的导入：

- `src/components/base/MButton.vue` - 移除 `import { defineProps, defineEmits }`
- `src/components/base/MInput.vue` - 移除 `import { defineProps, defineEmits }`
- `src/components/base/MCard.vue` - 移除 `import { defineProps }`
- `src/components/base/MList.vue` - 移除 `import { defineProps, defineEmits }`
- `src/components/business/MScanner.vue` - 移除 `import { defineProps, defineEmits }`

### 2. Sass 弃用警告

**问题描述：**
```
Deprecation Warning [legacy-js-api]: The legacy JS API is deprecated and will be removed in Dart Sass 2.0.0.
Deprecation Warning [import]: Sass @import rules are deprecated and will be removed in Dart Sass 3.0.0.
```

**修复方案：**

在 `vite.config.ts` 中配置 Sass 静默弃用警告：

```typescript
css: {
  preprocessorOptions: {
    scss: {
      silenceDeprecations: ['legacy-js-api', 'import'],
    },
  },
}
```

**说明：**
- UniApp 框架内部使用了 Sass 的 legacy JS API 和 @import 语法
- 这些是框架层面的问题，无法在应用层面完全解决
- 使用 `silenceDeprecations` 可以静默这些警告
- 等待 UniApp 框架更新后，这些警告会自动消失

## 相关文件修改

| 文件 | 修改内容 |
|------|--------|
| `src/components/base/MButton.vue` | 移除 defineProps/defineEmits 导入 |
| `src/components/base/MInput.vue` | 移除 defineProps/defineEmits 导入 |
| `src/components/base/MCard.vue` | 移除 defineProps 导入 |
| `src/components/base/MList.vue` | 移除 defineProps/defineEmits 导入 |
| `src/components/business/MScanner.vue` | 移除 defineProps/defineEmits 导入 |
| `vite.config.ts` | 添加 Sass silenceDeprecations 配置 |

## 最佳实践

### Vue 3 `<script setup>` 中的编译器宏

在 `<script setup>` 中，以下宏不需要导入：
- `defineProps`
- `defineEmits`
- `defineExpose`
- `defineSlots`
- `withDefaults`

```typescript
// ✅ 正确用法
<script setup lang="ts">
interface Props {
  msg: string
}

const props = withDefaults(defineProps<Props>(), {
  msg: 'Hello'
})

const emit = defineEmits<{
  (e: 'update', value: string): void
}>()
</script>
```

## 参考资源

- [Vue 3 Script Setup 文档](https://vuejs.org/api/sfc-script-setup.html)
- [Sass 模块系统](https://sass-lang.com/blog/the-module-system-is-launched)
- [Dart Sass 迁移指南](https://sass-lang.com/documentation/breaking-changes/import)
