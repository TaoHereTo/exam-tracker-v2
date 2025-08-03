'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useFormNotification } from "@/hooks/useFormNotification";
import { UnifiedImage } from "@/components/ui/UnifiedImage";
import { ValidationSchema, validateForm } from "@/lib/formValidation";
import { FormError } from "@/components/ui/form-error";
import { RainbowButton } from "@/components/magicui/rainbow-button";
import { MixedText } from "@/components/ui/MixedText";
import type { KnowledgeItem } from "@/types/record";

// 模块配置类型定义
interface ModuleConfig {
  title: string;
  hasSubCategory?: boolean;
  subCategories?: string[];
  hasDateField?: boolean;
  hasSpecialFields?: boolean;
  typePlaceholder?: string;
  notePlaceholder?: string;
  firstFieldLabel?: string;
  secondFieldLabel?: string;
  firstFieldPlaceholder?: string;
  secondFieldPlaceholder?: string;
}

// 统一表单组件属性
interface UnifiedKnowledgeFormProps {
  module: string;
  onAddKnowledge: (knowledge: Partial<KnowledgeItem> | Record<string, unknown>) => void;
  initialData?: Partial<KnowledgeItem> | Record<string, unknown>;
}

// 根据模块获取配置
const getModuleConfig = (module: string): ModuleConfig => {
  const configs: Record<string, ModuleConfig> = {
    'math': {
      title: '录入 - 数量关系',
      typePlaceholder: '例如：数学技巧',
      notePlaceholder: '请输入具体的技巧或知识点...'
    },
    'data-analysis': {
      title: '录入 - 资料分析',
      typePlaceholder: '例如：速算技巧',
      notePlaceholder: '请输入具体的技巧或知识点...'
    },
    'logic': {
      title: '录入 - 判断推理',
      hasSubCategory: true,
      subCategories: ['图形推理', '定义判断', '类比推理', '逻辑判断'],
      typePlaceholder: '例如：推理技巧',
      notePlaceholder: '请输入具体的技巧或知识点...'
    },
    'common': {
      title: '录入 - 常识判断',
      hasSubCategory: true,
      subCategories: ['经济常识', '法律常识', '科技常识', '人文常识', '地理国情'],
      typePlaceholder: '例如：常识技巧',
      notePlaceholder: '请输入具体的技巧或知识点...'
    },
    'verbal': {
      title: '录入 - 言语理解',
      hasSubCategory: true,
      subCategories: ['逻辑填空', '片段阅读', '成语积累'],
      hasSpecialFields: true,
      firstFieldLabel: '类型',
      secondFieldLabel: '技巧记录',
      firstFieldPlaceholder: '请输入类型...',
      secondFieldPlaceholder: '请输入技巧记录...'
    },
    'politics': {
      title: '录入 - 政治理论',
      hasDateField: true,
      firstFieldLabel: '文件来源',
      secondFieldLabel: '相关重点',
      firstFieldPlaceholder: '请输入文件来源',
      secondFieldPlaceholder: '请输入相关重点...'
    }
  };

  return configs[module] || {
    title: '录入 - 知识点',
    typePlaceholder: '例如：技巧类型',
    notePlaceholder: '请输入具体的技巧或知识点...'
  };
};

export const UnifiedKnowledgeForm: React.FC<UnifiedKnowledgeFormProps> = ({
  module,
  onAddKnowledge,
  initialData,
}) => {
  const config = useMemo(() => getModuleConfig(module), [module]);
  const { showError, showSuccess } = useFormNotification();

  // 基础字段状态
  const [firstField, setFirstField] = useState(
    (initialData as Record<string, unknown>)?.type as string ||
    (initialData as Record<string, unknown>)?.source as string ||
    (initialData as Record<string, unknown>)?.idiom as string || ''
  );
  const [secondField, setSecondField] = useState(
    (initialData as Record<string, unknown>)?.note as string ||
    (initialData as Record<string, unknown>)?.meaning as string || ''
  );
  const [imagePath, setImagePath] = useState<string | undefined>(
    (initialData as Record<string, unknown>)?.image_path as string | undefined
  );

  // 特殊字段状态
  const [subCategory, setSubCategory] = useState<string>(
    (initialData as Record<string, unknown>)?.subCategory as string ||
    (config.subCategories?.[0] || '')
  );
  const [date, setDate] = useState<Date | null>(
    (initialData as Record<string, unknown>)?.date ?
      new Date((initialData as Record<string, unknown>).date as string) : null
  );
  const [dateOpen, setDateOpen] = useState(false);

  // 错误状态
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 重置表单
  useEffect(() => {
    setFirstField(
      (initialData as Record<string, unknown>)?.type as string ||
      (initialData as Record<string, unknown>)?.source as string ||
      (initialData as Record<string, unknown>)?.idiom as string || ''
    );
    setSecondField(
      (initialData as Record<string, unknown>)?.note as string ||
      (initialData as Record<string, unknown>)?.meaning as string || ''
    );
    setImagePath((initialData as Record<string, unknown>)?.image_path as string | undefined);
    setSubCategory(
      (initialData as Record<string, unknown>)?.subCategory as string ||
      (config.subCategories?.[0] || '')
    );
    setDate(
      (initialData as Record<string, unknown>)?.date ?
        new Date((initialData as Record<string, unknown>).date as string) : null
    );
    setErrors({});
  }, [initialData, module, config.subCategories]);

  // 验证规则
  const validationSchema: ValidationSchema = {
    firstField: {
      custom: (value: string | number | boolean | undefined, allValues?: Record<string, unknown>) => {
        if (!value?.toString().trim() && !allValues?.secondField?.toString().trim()) {
          return "请至少填写一项";
        }
        return null;
      }
    },
    secondField: {
      custom: (value: string | number | boolean | undefined, allValues?: Record<string, unknown>) => {
        if (!value?.toString().trim() && !allValues?.firstField?.toString().trim()) {
          return "请至少填写一项";
        }
        return null;
      }
    }
  };

  // 表单验证
  const validateFormLocal = () => {
    const formData = { firstField, secondField };
    const newErrors = validateForm(formData, validationSchema);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理提交
  const handleSubmit = () => {
    if (!validateFormLocal()) {
      showError();
      return;
    }

    // 根据模块构建不同的数据格式
    let knowledgeData: Partial<KnowledgeItem> | Record<string, unknown> = { imagePath };

    switch (module) {
      case 'verbal':
        // 言语理解：idiom/meaning 映射到 type/note
        knowledgeData = {
          type: firstField,
          note: secondField,
          subCategory: subCategory as '逻辑填空' | '片段阅读' | '成语积累',
          imagePath: imagePath
        };
        break;
      case 'politics':
        // 政治理论：source/note + date
        knowledgeData = {
          source: firstField,
          note: secondField,
          date,
          imagePath
        };
        break;
      case 'logic':
        // 判断推理：type/note + subCategory
        knowledgeData = {
          type: firstField,
          note: secondField,
          subCategory: subCategory as '图形推理' | '定义判断' | '类比推理' | '逻辑判断',
          imagePath
        };
        break;
      case 'common':
        // 常识判断：type/note + subCategory
        knowledgeData = {
          type: firstField,
          note: secondField,
          subCategory: subCategory as '经济常识' | '法律常识' | '科技常识' | '人文常识' | '地理国情',
          imagePath
        };
        break;
      default:
        // 其他模块：type/note
        knowledgeData = {
          type: firstField,
          note: secondField,
          imagePath
        };
    }

    onAddKnowledge(knowledgeData);
    showSuccess();

    // 重置表单
    setFirstField('');
    setSecondField('');
    setImagePath(undefined);
    setSubCategory(config.subCategories?.[0] || '');
    setDate(null);
    setErrors({});
  };

  // 字段变化处理
  const handleFirstFieldChange = (value: string) => {
    setFirstField(value);
    if (errors.firstField) {
      setErrors(prev => ({ ...prev, firstField: "" }));
    }
  };

  const handleSecondFieldChange = (value: string) => {
    setSecondField(value);
    if (errors.secondField) {
      setErrors(prev => ({ ...prev, secondField: "" }));
    }
  };

  // 日期选择处理
  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate ?? null);
    setDateOpen(false);
  };

  // 获取字段标签和占位符
  const getFieldConfig = () => {
    if (module === 'verbal') {
      const isIdiomMode = subCategory === '成语积累';
      return {
        firstLabel: isIdiomMode ? '成语' : '类型',
        secondLabel: isIdiomMode ? '含义' : '技巧记录',
        firstPlaceholder: isIdiomMode ? '请输入成语' : '请输入类型...',
        secondPlaceholder: isIdiomMode ? '请输入成语含义...' : '请输入技巧记录...'
      };
    }

    return {
      firstLabel: config.firstFieldLabel || '类型',
      secondLabel: config.secondFieldLabel || '技巧记录',
      firstPlaceholder: config.firstFieldPlaceholder || config.typePlaceholder,
      secondPlaceholder: config.secondFieldPlaceholder || config.notePlaceholder
    };
  };

  const fieldConfig = getFieldConfig();

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle><MixedText text={config.title} /></CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 子分类选择器 */}
        {config.hasSubCategory && config.subCategories && (
          <div className="space-y-2">
            <Label htmlFor="subCategory">
              <MixedText text={
                module === 'logic' ? '推理类型' :
                  module === 'common' ? '常识类型' :
                    module === 'verbal' ? '言语类型' : '子分类'
              } />
            </Label>
            <Select value={subCategory} onValueChange={setSubCategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="请选择类型" />
              </SelectTrigger>
              <SelectContent>
                {config.subCategories.map((category: string) => (
                  <SelectItem key={category} value={category}>
                    <MixedText text={category} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 日期选择器 */}
        {config.hasDateField && (
          <div className="space-y-2">
            <Label><MixedText text="选择发布日期" /></Label>
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  {date ? date.toLocaleDateString() : <span className="text-muted-foreground"><MixedText text="选择日期" /></span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="min-w-[260px] flex justify-center p-0" align="center">
                <Calendar
                  mode="single"
                  selected={date ?? undefined}
                  onSelect={handleDateSelect}
                  initialFocus
                  required={false}
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* 第一个字段 */}
        <div className="space-y-2">
          <Label htmlFor="firstField"><MixedText text={fieldConfig.firstLabel} /></Label>
          <Input
            id="firstField"
            type="text"
            placeholder={fieldConfig.firstPlaceholder}
            value={firstField}
            onChange={e => handleFirstFieldChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.stopPropagation(); }}
            className={`${errors.firstField ? 'border-red-500 ring-red-500/20' : ''}`}
          />
          <FormError error={errors.firstField} />
        </div>

        {/* 第二个字段 */}
        <div className="space-y-2">
          <Label htmlFor="secondField"><MixedText text={fieldConfig.secondLabel} /></Label>
          <Textarea
            id="secondField"
            placeholder={fieldConfig.secondPlaceholder}
            value={secondField}
            onChange={e => handleSecondFieldChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.stopPropagation(); }}
            className={`${errors.secondField ? 'border-red-500 ring-red-500/20' : ''}`}
          />
          <FormError error={errors.secondField} />
        </div>

        {/* 图片上传组件 */}
        <div className="pt-0">
          <UnifiedImage
            mode="upload"
            value={imagePath}
            onChange={setImagePath}
          />
        </div>
      </CardContent>
      <CardFooter className="pt-1">
        <RainbowButton
          className="w-full text-base font-medium"
          type="button"
          onClick={handleSubmit}
          size="default"
        >
          <MixedText text="保存知识点" />
        </RainbowButton>
      </CardFooter>
    </Card>
  );
}; 