import React, { useState, useCallback } from 'react';
import ModuleForm from '@/components/forms/ModuleForm';
import { MixedText } from '@/components/ui/MixedText';
import type { KnowledgeItem } from "@/types/record";
import { MODULES } from "@/config/exam";
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsContents } from '@/components/ui/simple-tabs';
import { cn } from '@/lib/utils';

interface KnowledgeEntryViewProps {
    onAddKnowledge: (knowledge: KnowledgeItem) => void;
    defaultTab?: string;
}

const KnowledgeEntryView: React.FC<KnowledgeEntryViewProps> = ({ onAddKnowledge, defaultTab = 'data-analysis' }) => {
    const [tab, setTab] = useState(defaultTab);

    // 包装函数，自动加上 module 字段
    const handleAdd = useCallback((module: string) => (data: Partial<KnowledgeItem>) => {
        onAddKnowledge({ ...data, module } as KnowledgeItem);
    }, [onAddKnowledge]);

    return (
        <div className="w-full flex flex-col items-center knowledge-entry-container">
            <Tabs defaultValue={defaultTab} className="w-full">
                <div className="flex justify-center w-full mb-4">
                    <TabsList className="flex-nowrap overflow-x-auto scrollbar-hide text-base h-10 px-1 w-fit max-w-full">
                        {MODULES.map(({ value, label }) => (
                            <TabsTrigger
                                key={value}
                                value={value}
                                className="py-1 whitespace-nowrap"
                            >
                                <MixedText text={label} />
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                <TabsContents className="py-4 px-2">
                    {MODULES.map(({ value }) => (
                        <TabsContent key={value} value={value} className="outline-none flex flex-col gap-6">
                            <div className="w-full max-w-xl mx-auto pb-4">
                                <ModuleForm
                                    module={value as 'math' | 'logic' | 'data-analysis' | 'common' | 'verbal' | 'politics'}
                                    onAddKnowledge={handleAdd(value)}
                                />
                            </div>
                        </TabsContent>
                    ))}
                </TabsContents>
            </Tabs>
        </div>
    );
};

export default KnowledgeEntryView;