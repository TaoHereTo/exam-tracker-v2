'use client';

import { KnowledgeForm, KnowledgeFormProps } from './KnowledgeForm';

export default function LogicForm(props: Omit<KnowledgeFormProps, 'title' | 'typePlaceholder' | 'notePlaceholder'>) {
    return <KnowledgeForm title="录入 - 判断推理" typePlaceholder="例如：推理技巧" notePlaceholder="请输入具体 的技巧或知识点..." {...props} />;
} 