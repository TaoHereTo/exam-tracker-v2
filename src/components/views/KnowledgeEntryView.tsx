import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import DataAnalysisForm from '../forms/knowledge/DataAnalysisForm';
import PoliticsForm from '../forms/knowledge/PoliticsForm';
import MathForm from '../forms/knowledge/MathForm';
import CommonForm from '../forms/knowledge/CommonForm';
import VerbalForm from '../forms/knowledge/VerbalForm';
import LogicForm from '../forms/knowledge/LogicForm';

interface KnowledgeEntryViewProps {
    onAddKnowledge: (knowledge: any) => void;
    defaultTab?: string;
}

const KnowledgeEntryView: React.FC<KnowledgeEntryViewProps> = ({ onAddKnowledge, defaultTab = 'data-analysis' }) => {
    // 包装函数，自动加上 module 字段
    const handleAdd = (module: string) => (data: any) => {
        onAddKnowledge({ ...data, module });
    };
    return (
        <Tabs defaultValue={defaultTab} className="w-full max-w-2xl mx-auto">
            <TabsList className="mb-4 flex flex-wrap gap-2 w-full justify-center text-base h-12">
                <TabsTrigger value="data-analysis">资料分析</TabsTrigger>
                <TabsTrigger value="politics">政治理论</TabsTrigger>
                <TabsTrigger value="math">数量关系</TabsTrigger>
                <TabsTrigger value="common">常识判断</TabsTrigger>
                <TabsTrigger value="verbal">言语理解</TabsTrigger>
                <TabsTrigger value="logic">判断推理</TabsTrigger>
            </TabsList>
            <TabsContent value="data-analysis">
                <DataAnalysisForm onAddKnowledge={handleAdd('data-analysis')} />
            </TabsContent>
            <TabsContent value="politics">
                <PoliticsForm onAddKnowledge={handleAdd('politics')} />
            </TabsContent>
            <TabsContent value="math">
                <MathForm onAddKnowledge={handleAdd('math')} />
            </TabsContent>
            <TabsContent value="common">
                <CommonForm onAddKnowledge={handleAdd('common')} />
            </TabsContent>
            <TabsContent value="verbal">
                <VerbalForm onAddKnowledge={handleAdd('verbal')} />
            </TabsContent>
            <TabsContent value="logic">
                <LogicForm onAddKnowledge={handleAdd('logic')} />
            </TabsContent>
        </Tabs>
    );
};

export default KnowledgeEntryView; 