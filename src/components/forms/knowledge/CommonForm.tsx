'use client';

import { KnowledgeForm } from './KnowledgeForm';
export default function CommonForm(props) {
    return <KnowledgeForm title="录入 - 常识判断" typePlaceholder="例如：常识技巧" notePlaceholder="请输入具体的技巧或知识点..." {...props} />;
} 