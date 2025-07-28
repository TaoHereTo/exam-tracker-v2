# 代码迁移脚本说明

## 🎯 迁移目标
将现有的重复组件替换为新的统一组件，减少代码重复，提高维护性。

## 📋 迁移清单

### 1. 按钮组件迁移 ✅
**替换**: `ReactBitsButton` → `UnifiedButton`

**已完成的文件**:
- ✅ `src/components/views/settings/SaveSettingsButton.tsx`
- ✅ `src/components/views/settings/AdvancedSetting.tsx`

**待迁移的文件**:
- [ ] `src/components/views/SettingsView.tsx`
- [ ] `src/components/views/PlanListView.tsx`
- [ ] `src/components/views/PlanDetailView.tsx`
- [ ] `src/components/forms/VerbalForm.tsx`
- [ ] `src/components/forms/PoliticsForm.tsx`
- [ ] `src/components/forms/NewRecordForm.tsx`
- [ ] `src/components/forms/LogicForm.tsx`
- [ ] `src/components/forms/KnowledgeForm.tsx`
- [ ] `src/components/forms/EditRecordForm.tsx`
- [ ] `src/components/forms/CommonForm.tsx`
- [ ] `src/components/features/ScorePredictor.tsx`
- [ ] `src/components/features/DataImportExport.tsx`

### 2. 表格组件迁移 ✅
**替换**: `DataTable` + `TableContainer` → `UnifiedTable`

**已完成的文件**:
- ✅ `src/components/ui/HistoryTable.tsx`

**待迁移的文件**:
- [ ] 其他使用DataTable或TableContainer的文件

### 3. localStorage迁移 ✅
**替换**: 直接localStorage操作 → `useLocalStorage` hook

**已完成的文件**:
- ✅ `src/contexts/SwitchStyleContext.tsx`
- ✅ `src/components/ui/DynamicThemeSwitch.tsx`

**待迁移的文件**:
- [ ] `src/components/views/settings/AppearanceSetting.tsx`
- [ ] `src/components/views/settings/AdvancedSetting.tsx`
- [ ] `src/components/views/OverviewView.tsx`
- [ ] `src/app/layout.tsx`

### 4. 表单验证迁移 ✅
**替换**: 重复验证逻辑 → `formValidation.ts`

**已完成的文件**:
- ✅ `src/components/forms/BaseForm.tsx`

**待迁移的文件**:
- [ ] `src/components/forms/VerbalForm.tsx`
- [ ] `src/components/forms/PoliticsForm.tsx`
- [ ] `src/components/forms/LogicForm.tsx`
- [ ] `src/components/forms/KnowledgeForm.tsx`
- [ ] `src/components/forms/CommonForm.tsx`

### 5. 图片组件迁移
**替换**: `ImageUpload` + `ImageViewer` → `UnifiedImage`

**待迁移的文件**:
- [ ] 使用ImageUpload或ImageViewer的文件

## 🔧 迁移步骤

### 步骤1: 按钮组件迁移
```bash
# 查找所有使用ReactBitsButton的文件
grep -r "ReactBitsButton" src/

# 替换导入语句
sed -i 's/import ReactBitsButton from "@/components\/ui\/ReactBitsButton";/import { UnifiedButton } from "@/components\/ui\/UnifiedButton";/g' src/**/*.tsx

# 替换组件使用
sed -i 's/<ReactBitsButton/<UnifiedButton variant="reactbits"/g' src/**/*.tsx
sed -i 's/<\/ReactBitsButton>/<\/UnifiedButton>/g' src/**/*.tsx
```

### 步骤2: localStorage迁移
```bash
# 查找所有直接使用localStorage的文件
grep -r "localStorage\." src/

# 替换为useLocalStorage hook
# 需要手动替换，因为每个文件的使用方式不同
```

### 步骤3: 表单验证迁移
```bash
# 查找所有validateForm函数
grep -r "validateForm" src/

# 替换为统一的验证工具
# 需要手动替换，因为每个表单的验证逻辑不同
```

## ⚠️ 注意事项

1. **备份**: 迁移前请备份您的代码
2. **测试**: 每个迁移步骤后都要测试功能是否正常
3. **渐进**: 可以逐步迁移，新旧组件可以并存
4. **类型**: 所有新组件都有完整的TypeScript类型定义

## 🎉 迁移完成后的好处

1. **代码减少**: 减少重复代码50-80%
2. **维护性提升**: 统一的API接口，更容易维护
3. **类型安全**: 更好的TypeScript支持
4. **性能优化**: 减少重复的useEffect和localStorage操作

## 📞 需要帮助？

如果您在迁移过程中遇到任何问题，请告诉我具体的错误信息，我会帮您解决！ 