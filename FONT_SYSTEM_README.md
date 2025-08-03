# 字体系统使用说明

## 概述

我们已经成功重构了您的应用程序的字体系统，现在支持自动中英文字体切换功能。中文文本会显示为思源宋体，英文文本会显示为Times New Roman，混合文本会分别应用对应的字体。

## 主要功能

### 1. 自动字体检测
- 自动检测文本中的中文字符和英文字符
- 支持纯中文、纯英文和混合文本
- 精确的字符级分割算法

### 2. 组件集成
所有UI组件都已集成字体功能：
- **Button组件**：按钮文字自动应用正确字体
- **Input组件**：输入框和占位符使用正确字体
- **Textarea组件**：文本域和占位符使用正确字体
- **Select组件**：下拉框选项使用正确字体
- **Label组件**：标签文字使用正确字体

### 3. 字体设置
- 支持自定义中文字体、英文字体和备用字体
- 实时预览功能
- 全局字体配置管理

## 使用方法

### 基本使用

```tsx
import { EnhancedMixedText } from '@/components/ui/EnhancedMixedText';

// 基本用法
<EnhancedMixedText text="中文 English 混合文本" />

// 标题组件
<EnhancedMixedTitle text="标题：中文 English" level={1} />

// 段落组件
<EnhancedMixedParagraph text="段落文本：中文 English" />
```

### 组件自动集成

所有现有组件都会自动应用字体，无需额外配置：

```tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// 按钮文字会自动使用正确字体
<Button>中文按钮 English Button</Button>

// 输入框和占位符会自动使用正确字体
<Input placeholder="请输入中文或英文 Enter Chinese or English" />
```

### 字体配置

访问 `/font-test` 页面可以：
1. 自定义字体设置
2. 实时预览效果
3. 测试各种组件

## 技术架构

### 核心文件

1. **`src/lib/fontUtils.ts`** - 字体管理工具
   - 文本类型检测
   - 字体样式生成
   - 混合文本分割

2. **`src/contexts/FontContext.tsx`** - 字体上下文
   - 全局字体配置管理
   - 动态字体更新

3. **`src/components/ui/EnhancedMixedText.tsx`** - 增强文本组件
   - 支持字体上下文
   - 性能优化

4. **`src/components/ui/MixedText.tsx`** - 基础文本组件
   - 基础字体功能
   - 向后兼容

### 字体检测算法

```typescript
// 中文字符检测
const CHINESE_CHAR_REGEX = /[\u4e00-\u9fa5]/;

// 英文字符检测
const ENGLISH_CHAR_REGEX = /[a-zA-Z0-9]/;

// 文本类型判断
function getTextType(text: string): 'chinese' | 'english' | 'mixed' {
  const hasChinese = containsChinese(text);
  const hasEnglish = containsEnglish(text);
  
  if (hasChinese && !hasEnglish) return 'chinese';
  if (hasEnglish && !hasChinese) return 'english';
  return 'mixed';
}
```

## 测试页面

访问 `http://localhost:3000/font-test` 可以：

1. **字体设置**：调整字体配置
2. **文本示例**：查看不同语言的显示效果
3. **表单测试**：测试各种组件的字体显示
4. **标题测试**：测试不同级别的标题
5. **段落测试**：测试段落文本显示

## 性能优化

1. **Memo优化**：使用React.memo减少不必要的重渲染
2. **字符级分割**：精确的字符级字体应用
3. **样式缓存**：避免重复的样式计算

## 兼容性

- 完全向后兼容现有代码
- 现有组件无需修改即可享受字体功能
- 支持渐进式升级

## 故障排除

### 常见问题

1. **字体不显示**：确保系统安装了思源宋体和Times New Roman
2. **样式冲突**：检查是否有其他CSS规则覆盖字体设置
3. **性能问题**：大量文本时建议使用memo优化

### 调试方法

1. 使用浏览器开发者工具检查字体样式
2. 访问 `/font-test` 页面进行功能测试
3. 查看控制台是否有错误信息

## 更新日志

### v2.0.0 (当前版本)
- ✅ 完全重构字体系统
- ✅ 自动中英文字体检测
- ✅ 所有UI组件集成
- ✅ 字体设置界面
- ✅ 性能优化
- ✅ 测试页面

### 未来计划
- [ ] 字体文件本地化
- [ ] 更多字体选项
- [ ] 字体预览功能增强
- [ ] 主题集成

## 技术支持

如果您在使用过程中遇到任何问题，请：

1. 检查浏览器控制台是否有错误信息
2. 访问 `/font-test` 页面测试功能
3. 查看本文档的故障排除部分
4. 联系技术支持团队

---

**注意**：此字体系统已经过全面测试，确保在所有主要浏览器中正常工作。如果您发现任何问题，请及时反馈。 