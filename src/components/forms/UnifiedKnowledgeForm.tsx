'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CircularButton } from "@/components/ui/circular-button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import toast from 'react-hot-toast';
import { useNotification } from '@/components/magicui/NotificationProvider';

import { ValidationSchema, validateForm, FormData, FormErrors } from "@/lib/formValidation";

import { MixedText } from "@/components/ui/MixedText";
import type { KnowledgeItem } from "@/types/record";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/animate-ui/components/animate/tooltip";
import { Calendar as CalendarIcon } from "lucide-react";
import { BaseForm, FormField, FormInput, FormSelect, FormTextarea, useFormContext } from "@/components/forms/BaseForm";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useThemeMode } from "@/hooks/useThemeMode";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import WangEditorWrapper from "@/components/rich-text-editors/WangEditorWrapper";

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
  isInDialog?: boolean;
  onFullscreenModeChange?: (isFullscreen: boolean) => void;
  externalIsFullscreen?: boolean;
}

// 根据模块获取配置
const getModuleConfig = (module: string): ModuleConfig => {
  const configs: Record<string, ModuleConfig> = {
    'math': {
      title: '录入 - 数量关系',
      typePlaceholder: '例如：数学技巧',
      notePlaceholder: '请输入知识点，可以通过拖拽或快捷键上传图片...'
    },
    'data-analysis': {
      title: '录入 - 资料分析',
      typePlaceholder: '例如：速算技巧',
      notePlaceholder: '请输入知识点，可以通过拖拽或快捷键上传图片...'
    },
    'logic': {
      title: '录入 - 判断推理',
      hasSubCategory: true,
      subCategories: ['图形推理', '定义判断', '类比推理', '逻辑判断'],
      typePlaceholder: '例如：推理技巧',
      notePlaceholder: '请输入知识点，可以通过拖拽或快捷键上传图片...'
    },
    'common': {
      title: '录入 - 常识判断',
      hasSubCategory: true,
      subCategories: ['经济常识', '法律常识', '科技常识', '人文常识', '地理国情'],
      typePlaceholder: '例如：常识技巧',
      notePlaceholder: '请输入知识点，可以通过拖拽或快捷键上传图片...'
    },
    'verbal': {
      title: '录入 - 言语理解',
      hasSubCategory: true,
      subCategories: ['逻辑填空', '片段阅读', '成语积累'],
      hasSpecialFields: true,
      firstFieldLabel: '类型',
      secondFieldLabel: '技巧记录',
      firstFieldPlaceholder: '请输入类型...',
      secondFieldPlaceholder: '请输入知识点，可以通过拖拽或快捷键上传图片...'
    },
    'politics': {
      title: '录入 - 政治理论',
      hasDateField: true,
      firstFieldLabel: '文件来源',
      secondFieldLabel: '相关重点',
      firstFieldPlaceholder: '请输入文件来源',
      secondFieldPlaceholder: '请输入知识点，可以通过拖拽或快捷键上传图片...'
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
  const { setValue, errors, clearError, getValue, validateField } = useFormContext();
  const currentDate = getValue('date') as string;
  const [date, setDate] = useState<Date | undefined>(currentDate ? new Date(currentDate) : undefined);
  const [dateOpen, setDateOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date | undefined>(currentDate ? new Date(currentDate) : undefined);
  const [pendingDate, setPendingDate] = useState<string | null>(null);

  // 当表单数据变化时，同步更新本地状态
  useEffect(() => {
    const newDate = currentDate ? new Date(currentDate) : undefined;
    setDate(newDate);
    if (newDate) {
      setCurrentMonth(newDate);
    }
  }, [currentDate]);

  // 当日期值更新时，验证字段
  useEffect(() => {
    if (pendingDate !== null) {
      // Validate the date field after state has been updated
      const validationError = validateField('date', pendingDate);
      if (validationError) {
        // Keep the error if validation fails
      } else if (errors['date']) {
        // Clear the error if validation passes
        clearError('date');
      }
      setPendingDate(null);
    }
  }, [pendingDate, validateField, errors, clearError]);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      // 打开时对齐到当前已选日期
      if (date) setCurrentMonth(date);
    }
    setDateOpen(open);
  };

  const handleDateSelect = (d: Date | undefined) => {
    setDate(d);
    const formatted = d ? format(d, 'yyyy-MM-dd') : '';
    setValue('date', formatted);

    // Set pending date to trigger validation after state update
    setPendingDate(formatted);

    // Automatically close the popover after selecting a date
    setDateOpen(false);
  };

  return (
    <Popover open={dateOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button type="button" className="w-full flex items-center justify-start text-left font-normal border px-3 py-2 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer rounded-md h-10 bg-white dark:bg-[#303030]"
          style={{
            transition: 'none',
            transform: 'none',
            boxShadow: 'none'
          }}>
          <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
          {date ? format(date, 'PPP', { locale: zhCN }) : <span className="text-gray-400 dark:text-gray-500">选择日期</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-[var(--z-dialog-popover)]" align="start">
        <Calendar
          mode="single"
          captionLayout="dropdown"
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          selected={date}
          onSelect={handleDateSelect}
          initialFocus={false}
          locale={zhCN}
          page="knowledge"
        />
      </PopoverContent>
    </Popover>
  );
}

export const UnifiedKnowledgeForm: React.FC<UnifiedKnowledgeFormProps> = ({
  module,
  onAddKnowledge,
  initialData,
  isInDialog = false,
  onFullscreenModeChange,
  externalIsFullscreen
}) => {
  const config = useMemo(() => getModuleConfig(module), [module]);

  const { notifyLoading, updateToSuccess, updateToError } = useNotification();

  // 获取模块特定的字段配置
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

  // 构建初始数据
  const getInitialData = (): FormData => {
    const data: FormData = {};

    if (initialData) {
      if ('type' in initialData) data.firstField = String(initialData.type || '');
      if ('source' in initialData) data.firstField = String(initialData.source || '');
      if ('note' in initialData) data.secondField = String(initialData.note || '');
      if ('subCategory' in initialData) data.subCategory = String(initialData.subCategory || '');
      if ('date' in initialData) data.date = String(initialData.date || '');
    }

    // 设置默认值
    if (!data.date) {
      data.date = format(new Date(), 'yyyy-MM-dd');
    }

    return data;
  };

  // 验证规则
  const getValidationSchema = (module: string, config: ModuleConfig): ValidationSchema => {
    const fieldConfig = getFieldConfig();

    const schema: ValidationSchema = {
      firstField: {
        required: true,
        minLength: 1,
        custom: (value) => {
          if (!value || !String(value).trim()) {
            return `请输入${fieldConfig.firstLabel}`;
          }
          return null;
        }
      },
      secondField: {
        required: true,
        minLength: 1,
        custom: (value) => {
          if (!value || !String(value).trim()) {
            return `请输入${fieldConfig.secondLabel}`;
          }
          return null;
        }
      }
    };

    // For subCategory, it's always required for modules that have subCategories
    // The validation will check the actual form values, not the initial data
    if (config.hasSubCategory) {
      schema.subCategory = {
        required: true,
        custom: (value) => {
          if (!value || !String(value).trim()) {
            return '请选择子分类';
          }
          return null;
        }
      };
    }

    if (config.hasDateField) {
      schema.date = {
        required: true,
        custom: (value) => {
          // Check if value exists and is not empty
          if (!value || !String(value).trim()) {
            return '请选择日期';
          }
          return null; // No error if value exists
        }
      };
    }

    return schema;
  };

  // 处理表单提交
  const handleSubmit = async (data: FormData, errors?: FormErrors) => {
    // 如果有验证错误，显示第一个错误的toast消息
    if (errors && Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      toast.error(firstError);
      return;
    }

    const config = getModuleConfig(module);

    // 立即显示 loading toast
    const loadingToastId = notifyLoading?.('正在保存到云端...');

    try {

      const knowledgeData: Partial<KnowledgeItem> = {
        module: module as 'math' | 'data-analysis' | 'logic' | 'common' | 'politics' | 'verbal',
        subCategory: config.hasSubCategory ? String(data.subCategory || '') as KnowledgeItem['subCategory'] : undefined,
        date: config.hasDateField ? String(data.date || '') : undefined,
        // 根据模块类型设置字段
        ...(module === 'politics'
          ? {
            source: String(data.firstField || ''),
            note: String(data.secondField || '')
          }
          : {
            type: String(data.firstField || ''),
            note: String(data.secondField || '')
          })
      };

      // 调用onAddKnowledge（禁用其内部的toast显示）
      await onAddKnowledge(knowledgeData);

      // 如果是编辑模式（有initialData），不显示立即成功toast，让调用方处理
      if (!initialData) {
        // 更新 toast 为成功状态（仅新增模式）
        if (loadingToastId) {
          updateToSuccess?.(loadingToastId, '知识点已成功保存到云端！');
        } else {
          // 如果没有loading toast，直接显示成功toast
          toast.success('知识点已成功保存到云端！');
        }
      } else {
        // 编辑模式：关闭loading toast，让调用方的autoUpdateKnowledge处理成功toast
        if (loadingToastId) {
          toast.dismiss(loadingToastId);
        }
      }

    } catch (error) {
      console.error('保存知识点失败:', error);
      updateToError?.(loadingToastId || '', '保存知识点失败，请重试');
    }
  };

  const fieldConfig = getFieldConfig();
  const { isDarkMode } = useThemeMode();

  // 富文本编辑器字段组件
  const RichTextEditorField = () => {
    const { setValue, getValue } = useFormContext();
    const currentValue = getValue('secondField') as string;


    // 编辑器高度设置
    const editorMinHeight = "400px";
    const editorMaxHeight = "900px";

    return (
      <div className="rich-text-editor-wrapper">
        {/* 统一使用独立的全屏编辑器，无论是知识点汇总还是知识点录入 */}
        <WangEditorWrapper
          content={currentValue || ''}
          onChange={(value) => setValue('secondField', value || '')}
          placeholder={fieldConfig.secondPlaceholder}
          className="w-full"
          customMinHeight={editorMinHeight}
          customMaxHeight={editorMaxHeight}
        />
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className="flex items-start justify-center w-full">
        {isInDialog ? (
          // When in dialog, render without Card wrapper to avoid nested card appearance
          <div className="w-full max-w-4xl flex flex-col">
            <div className={`${!initialData ? 'pt-0' : 'pt-4'} p-card`}>
              <BaseForm
                className="form-stack"
                validationSchema={getValidationSchema(module, config)}
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
                  <RichTextEditorField />
                </FormField>

                {/* 保存按钮在右下角 */}
                <div className="form-actions">
                  <div className="flex justify-end">
                    <Button type="submit" variant="default" className="flex items-center justify-center py-2 px-6 text-sm h-10 rounded-full bg-[#f97316] hover:bg-[#f97316]/90 text-white">
                      <MixedText text="保存知识点" />
                    </Button>
                  </div>
                </div>
              </BaseForm>
            </div>
          </div>
        ) : (
          // When not in dialog, render without Card wrapper
          <div className="w-full max-w-4xl flex flex-col">
            <div className="pt-4 pb-4">
              {/* 非对话框模式下的表单 */}
              <BaseForm
                className="form-stack"
                validationSchema={getValidationSchema(module, config)}
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
                  <RichTextEditorField />
                </FormField>

                {/* 保存按钮在右下角 */}
                <div className="form-actions">
                  <div className="flex justify-end">
                    <Button type="submit" variant="default" className="flex items-center justify-center py-2 px-6 text-sm h-10 rounded-full bg-[#f97316] hover:bg-[#f97316]/90 text-white">
                      <MixedText text="保存知识点" />
                    </Button>
                  </div>
                </div>
              </BaseForm>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};