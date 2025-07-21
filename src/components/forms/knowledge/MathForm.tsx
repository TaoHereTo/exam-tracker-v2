'use client';

import { KnowledgeForm } from './KnowledgeForm';
export default function MathForm(props) {
    return <KnowledgeForm title="录入 - 数量关系" typePlaceholder="例如：数学技巧" notePlaceholder="请输入具体的技巧或知识点..." {...props} />;
} 