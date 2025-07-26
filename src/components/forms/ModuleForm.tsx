'use client';

import { KnowledgeForm, KnowledgeFormProps } from './KnowledgeForm';

interface ModuleFormProps extends Omit<KnowledgeFormProps, 'title' | 'typePlaceholder' | 'notePlaceholder'> {
    module: 'math' | 'logic' | 'data-analysis' | 'common';
}

const MODULE_CONFIG = {
    'math': {
        title: '录入 - 数量关系',
        typePlaceholder: '例如：数学技巧',
        notePlaceholder: '请输入具体的技巧或知识点...'
    },
    'logic': {
        title: '录入 - 判断推理',
        typePlaceholder: '例如：推理技巧',
        notePlaceholder: '请输入具体的技巧或知识点...'
    },
    'data-analysis': {
        title: '录入 - 资料分析',
        typePlaceholder: '例如：速算技巧',
        notePlaceholder: '请输入具体的技巧或知识点...'
    },
    'common': {
        title: '录入 - 常识判断',
        typePlaceholder: '例如：常识技巧',
        notePlaceholder: '请输入具体的技巧或知识点...'
    }
};

export default function ModuleForm({ module, ...props }: ModuleFormProps) {
    const config = MODULE_CONFIG[module];
    return <KnowledgeForm {...config} {...props} />;
} 