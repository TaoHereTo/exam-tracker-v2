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
import { ValidationSchema, validateForm, FormData } from "@/lib/formValidation";
import { RainbowButton } from "@/components/magicui/rainbow-button";
import { MixedText } from "@/components/ui/MixedText";
import type { KnowledgeItem } from "@/types/record";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { BaseForm, FormField, FormInput, FormSelect, FormTextarea, useFormContext } from "@/components/forms/BaseForm";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

// 模块配置类型定义
interface ModuleConfig {
  title: string;
  hasSubCategory?: boolean;
  subCategories?: string[];
  hasDateField?: boolean;
  hasSpecialFields?: boolean;
  firstFieldLabel?: string;
  secondFieldLabel?: string;
  firstFieldPlaceholder?: string;
  secondFieldPlaceholder?: string;
  typePlaceholder?: string;
  notePlaceholder?: string;
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

// 日期字段组件
function DateField() {
  const { setValue, errors, clearError, getValue } = useFormContext();
  const currentDate = getValue('date') as string;
  const [date, setDate] = useState<Date | undefined>(currentDate ? new Date(currentDate) : undefined);
  const [dateOpen, setDateOpen] = useState(false);

  return (
    <Popover open={dateOpen} onOpenChange={setDateOpen}>
      <PopoverTrigger asChild>
        <div className="w-full flex items-center justify-start text-left font-normal border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer rounded-md">
          {date ? format(date, 'PPP', { locale: zhCN }) : <span className="text-muted-foreground">选择日期</span>}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            setDate(d);
            const formatted = d ? format(d, 'yyyy-MM-dd') : '';
            setValue('date', formatted);
            if (errors['date']) clearError('date');
          }}
          initialFocus
          locale={zhCN}
        />
      </PopoverContent>
    </Popover>
  );
}

export const UnifiedKnowledgeForm: React.FC<UnifiedKnowledgeFormProps> = ({
  module,
  onAddKnowledge,
  initialData,
}) => {
  const config = useMemo(() => getModuleConfig(module), [module]);
  const { showError, showSuccess } = useFormNotification();

  // 构建初始数据
  const getInitialData = (): FormData => {
    const data: FormData = {};

    if (initialData) {
      if ('type' in initialData) data.firstField = String(initialData.type || '');
      if ('source' in initialData) data.firstField = String(initialData.source || '');
      if ('note' in initialData) data.secondField = String(initialData.note || '');
      if ('subCategory' in initialData) data.subCategory = String(initialData.subCategory || '');
      if ('date' in initialData) data.date = String(initialData.date || '');
      if ('imagePath' in initialData) data.imagePath = String(initialData.imagePath || '');
    }

    // 设置默认值
    if (!data.firstField) data.firstField = '';
    if (!data.secondField) data.secondField = '';
    if (!data.subCategory && config.subCategories) data.subCategory = config.subCategories[0];
    if (!data.date) data.date = '';
    if (!data.imagePath) data.imagePath = '';

    return data;
  };

  // 构建验证规则
  const getValidationSchema = (): ValidationSchema => {
    const schema: ValidationSchema = {
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

    // 为政治理论模块添加日期验证
    if (module === 'politics') {
      schema.date = {
        custom: (value: string | number | boolean | undefined) => {
          if (!value?.toString().trim()) {
            return "请选择发布日期";
          }
          return null;
        }
      };
    }

    return schema;
  };

  // 处理表单提交
  const handleSubmit = (data: Record<string, unknown>) => {
    // 根据模块构建不同的数据格式
    let knowledgeData: Partial<KnowledgeItem> | Record<string, unknown> = {
      imagePath: data.imagePath
    };

    switch (module) {
      case 'verbal':
        // 言语理解：统一使用 type/note 字段
        knowledgeData = {
          type: data.firstField,
          note: data.secondField,
          subCategory: data.subCategory as '逻辑填空' | '片段阅读' | '成语积累',
          imagePath: data.imagePath
        };
        break;
      case 'politics':
        // 政治理论：source/note + date
        knowledgeData = {
          source: data.firstField,
          note: data.secondField,
          date: data.date,
          imagePath: data.imagePath
        };
        break;
      case 'logic':
        // 判断推理：type/note + subCategory
        knowledgeData = {
          type: data.firstField,
          note: data.secondField,
          subCategory: data.subCategory as '图形推理' | '定义判断' | '类比推理' | '逻辑判断',
          imagePath: data.imagePath
        };
        break;
      case 'common':
        // 常识判断：type/note + subCategory
        knowledgeData = {
          type: data.firstField,
          note: data.secondField,
          subCategory: data.subCategory as '经济常识' | '法律常识' | '科技常识' | '人文常识' | '地理国情',
          imagePath: data.imagePath
        };
        break;
      default:
        // 其他模块：type/note
        knowledgeData = {
          type: data.firstField,
          note: data.secondField,
          imagePath: data.imagePath
        };
    }

    onAddKnowledge(knowledgeData);
    showSuccess();
  };

  // 获取字段标签和占位符
  const getFieldConfig = () => {
    if (module === 'verbal') {
      const subCategory = (initialData as Record<string, unknown>)?.subCategory as string || config.subCategories?.[0] || '';
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
      firstPlaceholder: config.firstFieldPlaceholder || config.typePlaceholder || '请输入类型...',
      secondPlaceholder: config.secondFieldPlaceholder || config.notePlaceholder || '请输入技巧记录...'
    };
  };

  const fieldConfig = getFieldConfig();

  // 图片上传处理组件
  const ImageUploadField = () => {
    const { setValue, getValue } = useFormContext();
    const currentImagePath = getValue('imagePath') as string;

    return (
      <div className="pt-0">
        <div className="flex items-center gap-2 mb-2">
          <Label className="text-sm font-medium">图片</Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p>可以上传相关的图片资料</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <UnifiedImage
          value={currentImagePath}
          onChange={(path) => {
            setValue('imagePath', path);
          }}
        />
      </div>
    );
  };

  return (
    <div className="flex items-start justify-center min-h-screen p-4 pt-4">
      <Card className="w-full max-w-md flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl">
            <MixedText text={config.title} />
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-2">
          <BaseForm
            className="form-stack"
            validationSchema={getValidationSchema()}
            onSubmit={handleSubmit}
            initialData={getInitialData()}
          >
            {/* 子分类选择器 */}
            {config.hasSubCategory && (
              <FormField name="subCategory" className="form-field">
                <Label htmlFor="subCategory">
                  <MixedText text="选择子分类" />
                </Label>
                <FormSelect
                  name="subCategory"
                  placeholder="请选择子分类"
                >
                  {config.subCategories?.map((category: string) => (
                    <SelectItem key={category} value={category}>
                      <MixedText text={category} />
                    </SelectItem>
                  ))}
                </FormSelect>
              </FormField>
            )}

            {/* 日期选择器 */}
            {config.hasDateField && (
              <FormField name="date" className="form-field">
                <Label htmlFor="date">
                  <MixedText text="选择发布日期" />
                </Label>
                <DateField />
              </FormField>
            )}

            {/* 第一个字段 */}
            <FormField name="firstField" className="form-field">
              <Label htmlFor="firstField">
                <MixedText text={fieldConfig.firstLabel} />
              </Label>
              <FormInput
                name="firstField"
                placeholder={fieldConfig.firstPlaceholder}
              />
            </FormField>

            {/* 第二个字段 */}
            <FormField name="secondField" className="form-field">
              <Label htmlFor="secondField">
                <MixedText text={fieldConfig.secondLabel} />
              </Label>
              <FormTextarea
                name="secondField"
                placeholder={fieldConfig.secondPlaceholder}
                className="min-h-[100px]"
                rows={4}
              />
            </FormField>

            {/* 图片上传组件 */}
            <ImageUploadField />

            <div className="form-actions">
              <RainbowButton type="submit" className="w-full py-4">
                <MixedText text="保存知识点" />
              </RainbowButton>
            </div>
          </BaseForm>
        </CardContent>
      </Card>
    </div>
  );
}; 