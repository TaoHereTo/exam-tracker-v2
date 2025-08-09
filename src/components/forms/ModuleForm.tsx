'use client';

import { UnifiedKnowledgeForm } from './UnifiedKnowledgeForm';
import type { KnowledgeItem } from "@/types/record";

interface ModuleFormProps {
    module: 'math' | 'logic' | 'data-analysis' | 'common' | 'verbal' | 'politics';
    onAddKnowledge: (knowledge: Partial<KnowledgeItem>) => void;
    initialData?: Partial<KnowledgeItem>;
}

export default function ModuleForm({ module, ...props }: ModuleFormProps) {
    return <UnifiedKnowledgeForm module={module} {...props} />;
} 