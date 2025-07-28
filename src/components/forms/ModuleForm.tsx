'use client';

import { KnowledgeForm } from './KnowledgeForm';
import { LogicForm } from './LogicForm';
import { CommonForm } from './CommonForm';
import type { KnowledgeItem } from "@/types/record";

interface ModuleFormProps {
    module: 'math' | 'logic' | 'data-analysis' | 'common';
    onAddKnowledge: (knowledge: Partial<KnowledgeItem>) => void;
    initialData?: Partial<KnowledgeItem>;
}

const MODULE_CONFIG = {
    'math': {
        title: '录入 - 数量关系',
        typePlaceholder: '例如：数学技巧',
        notePlaceholder: '请输入具体的技巧或知识点...'
    },
    'data-analysis': {
        title: '录入 - 资料分析',
        typePlaceholder: '例如：速算技巧',
        notePlaceholder: '请输入具体的技巧或知识点...'
    }
};

export default function ModuleForm({ module, ...props }: ModuleFormProps) {
    // 对于判断推理和常识判断，使用专门的表单组件
    if (module === 'logic') {
        return <LogicForm
            onAddKnowledge={props.onAddKnowledge}
            initialData={props.initialData as { type: string; note: string; subCategory: '图形推理' | '定义判断' | '类比推理' | '逻辑判断' } | undefined}
        />;
    }

    if (module === 'common') {
        return <CommonForm
            onAddKnowledge={props.onAddKnowledge}
            initialData={props.initialData as { type: string; note: string; subCategory: '经济常识' | '法律常识' | '科技常识' | '人文常识' | '地理国情' } | undefined}
        />;
    }

    // 对于其他模块，使用通用的KnowledgeForm
    const config = MODULE_CONFIG[module];
    return <KnowledgeForm
        {...config}
        onAddKnowledge={props.onAddKnowledge}
        initialData={props.initialData as { type: string; note: string } | undefined}
    />;
} 