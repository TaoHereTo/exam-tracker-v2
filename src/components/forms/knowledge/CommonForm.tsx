'use client';

import { KnowledgeForm, KnowledgeFormProps } from './KnowledgeForm';

export default function CommonForm(props: Omit<KnowledgeFormProps, 'title' | 'typePlaceholder' | 'notePlaceholder'>) {
    return <KnowledgeForm title="录入 - 常识判断" typePlaceholder="例如：常识技巧" notePlaceholder="请输入具体 的技巧或知识点..." {...props} />;
} 