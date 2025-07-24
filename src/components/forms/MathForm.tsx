'use client';

import { KnowledgeForm, KnowledgeFormProps } from './KnowledgeForm';

export default function MathForm(props: Omit<KnowledgeFormProps, 'title' | 'typePlaceholder' | 'notePlaceholder'>) {
    return <KnowledgeForm title="录入 - 数量关系" typePlaceholder="例如：数学技巧" notePlaceholder="请输入具体 的技巧或知识点..." {...props} />;
} 