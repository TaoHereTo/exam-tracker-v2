import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Bold, Italic, Palette, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useFormContext } from "./BaseForm";

interface FormattingToolbarProps {
  fieldName: string;
}

const colorOptions = [
  { value: 'red', label: '红色', color: '#ef4444' },
  { value: 'green', label: '绿色', color: '#22c55e' },
  { value: 'blue', label: '蓝色', color: '#3b82f6' },
  { value: 'yellow', label: '黄色', color: '#eab308' },
  { value: 'purple', label: '紫色', color: '#a855f7' },
  { value: 'orange', label: '橙色', color: '#f97316' },
];

export const FormattingToolbar: React.FC<FormattingToolbarProps> = ({ fieldName }) => {
  const { getValue, setValue } = useFormContext();
  const [selectedColor, setSelectedColor] = useState('red');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 检查当前选中文本的格式状态
  const getActiveFormats = useCallback(() => {
    const textarea = document.querySelector(`textarea[name="${fieldName}"]`) as HTMLTextAreaElement;
    if (!textarea) return [];

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = String(getValue(fieldName) || '');
    const selectedText = currentValue.substring(start, end);
    
    if (!selectedText) return [];

    const activeFormats = [];
    
    // 检查加粗
    if (selectedText.startsWith('**') && selectedText.endsWith('**') && selectedText.length > 4) {
      activeFormats.push('bold');
    }
    
    // 检查斜体
    if (selectedText.startsWith('*') && selectedText.endsWith('*') && 
        !selectedText.startsWith('**') && selectedText.length > 2) {
      activeFormats.push('italic');
    }
    
    // 检查颜色
    const colorRegex = new RegExp(`^\\{(${colorOptions.map(c => c.value).join('|')})\\}.*\\{/\\1\\}$`);
    if (colorRegex.test(selectedText)) {
      activeFormats.push('color');
    }

    return activeFormats;
  }, [fieldName, getValue]);

  const activeFormats = useMemo(() => getActiveFormats(), [getActiveFormats]);

  // 添加事件监听器来监听文本选择变化
  useEffect(() => {
    const textarea = document.querySelector(`textarea[name="${fieldName}"]`) as HTMLTextAreaElement;
    if (!textarea) return;

    const handleSelectionChange = () => {
      setRefreshTrigger(prev => prev + 1);
    };

    textarea.addEventListener('mouseup', handleSelectionChange);
    textarea.addEventListener('keyup', handleSelectionChange);
    textarea.addEventListener('select', handleSelectionChange);

    return () => {
      textarea.removeEventListener('mouseup', handleSelectionChange);
      textarea.removeEventListener('keyup', handleSelectionChange);
      textarea.removeEventListener('select', handleSelectionChange);
    };
  }, [fieldName]);

  const handleFormat = (formatType: 'bold' | 'italic' | 'color') => {
    const textarea = document.querySelector(`textarea[name="${fieldName}"]`) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = String(getValue(fieldName) || '');
    const selectedText = currentValue.substring(start, end);
    
    if (!selectedText) {
      alert('请先选中要格式化的文字');
      return;
    }

    const beforeText = currentValue.substring(0, start);
    const afterText = currentValue.substring(end);

    let prefix = '';
    let suffix = '';

    switch (formatType) {
      case 'bold':
        prefix = '**';
        suffix = '**';
        break;
      case 'italic':
        prefix = '*';
        suffix = '*';
        break;
      case 'color':
        prefix = `{${selectedColor}}`;
        suffix = `{/${selectedColor}}`;
        break;
    }

    // 更精确的格式检查
    let isFormatted = false;
    let unformattedText = selectedText;

    if (formatType === 'bold') {
      isFormatted = selectedText.startsWith('**') && selectedText.endsWith('**') && selectedText.length > 4;
      if (isFormatted) {
        unformattedText = selectedText.substring(2, selectedText.length - 2);
      }
    } else if (formatType === 'italic') {
      isFormatted = selectedText.startsWith('*') && selectedText.endsWith('*') && 
                   !selectedText.startsWith('**') && selectedText.length > 2;
      if (isFormatted) {
        unformattedText = selectedText.substring(1, selectedText.length - 1);
      }
    } else if (formatType === 'color') {
      const colorRegex = new RegExp(`^\\{${selectedColor}\\}(.*)\\{/${selectedColor}\\}$`);
      const match = selectedText.match(colorRegex);
      isFormatted = !!match;
      if (isFormatted && match) {
        unformattedText = match[1];
      }
    }
    
    let newValue: string;
    let newCursorStart: number;
    let newCursorEnd: number;

    if (isFormatted) {
      // Remove formatting
      newValue = beforeText + unformattedText + afterText;
      newCursorStart = start;
      newCursorEnd = start + unformattedText.length;
    } else {
      // Add formatting
      const formattedText = `${prefix}${selectedText}${suffix}`;
      newValue = beforeText + formattedText + afterText;
      newCursorStart = start + prefix.length;
      newCursorEnd = start + prefix.length + selectedText.length;
    }

    // 更新React表单状态
    setValue(fieldName, newValue);

    // Update DOM for immediate visual feedback and cursor position
    setTimeout(() => {
      textarea.value = newValue;
      textarea.focus();
      textarea.setSelectionRange(newCursorStart, newCursorEnd);
      // 触发状态更新
      setRefreshTrigger(prev => prev + 1);
    }, 0);
  };

  const selectedColorOption = colorOptions.find(c => c.value === selectedColor);

  return (
    <div className="flex items-center ml-auto">
      <div className="flex border border-input-border rounded-md bg-background shadow-sm">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="加粗"
          onClick={() => handleFormat('bold')}
          className={`px-1 py-0.5 h-6 w-6 min-w-0 rounded-l-md rounded-r-none border-0 toolbar-button-base toolbar-button-bold ${
            activeFormats.includes('bold') ? 'active' : ''
          }`}
        >
          <Bold className="h-3.5 w-3.5" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="斜体"
          onClick={() => handleFormat('italic')}
          className={`px-1 py-0.5 h-6 w-6 min-w-0 rounded-none border-0 border-l border-input-border toolbar-button-base toolbar-button-italic ${
            activeFormats.includes('italic') ? 'active' : ''
          }`}
        >
          <Italic className="h-3.5 w-3.5" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={`标记为${selectedColorOption?.label}`}
          onClick={() => handleFormat('color')}
          className={`px-1 py-0.5 h-6 w-6 min-w-0 rounded-none border-0 border-l border-input-border toolbar-button-base toolbar-button-color ${
            activeFormats.includes('color') ? 'active' : ''
          }`}
        >
          <Palette className="h-3.5 w-3.5" style={{ color: selectedColorOption?.color }} />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="px-1 py-0.5 h-6 w-5 min-w-0 rounded-l-none rounded-r-md border-0 border-l border-input-border toolbar-button-base toolbar-button-dropdown"
            >
              <ChevronDown className="h-2.5 w-2.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-auto min-w-[70px] p-1">
            {colorOptions.map((color) => (
              <DropdownMenuItem
                key={color.value}
                onClick={() => setSelectedColor(color.value)}
                className="flex items-center justify-center gap-1 px-1.5 py-1 text-xs"
              >
                <div 
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: color.color }}
                />
                <span className="whitespace-nowrap">{color.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};