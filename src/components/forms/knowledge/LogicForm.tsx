'use client';

import { KnowledgeForm } from './KnowledgeForm';
export default function LogicForm(props) {
    return <KnowledgeForm title="录入 - 判断推理" typePlaceholder="例如：推理技巧" notePlaceholder="请输入具体的技巧或知识点..." {...props} />;
} 