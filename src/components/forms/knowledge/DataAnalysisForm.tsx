'use client';

import { KnowledgeForm, KnowledgeFormProps } from './KnowledgeForm';

export default function DataAnalysisForm(props: Omit<KnowledgeFormProps, 'title' | 'typePlaceholder' | 'notePlaceholder'>) {
    return <KnowledgeForm title="录入 - 资料分析" typePlaceholder="例如：速算技巧" notePlaceholder="请输入具体的技巧或知识点..." {...props} />;
} 