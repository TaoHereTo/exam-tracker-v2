import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import DataAnalysisForm from '../forms/knowledge/DataAnalysisForm';
import PoliticsForm from '../forms/knowledge/PoliticsForm';
import MathForm from '../forms/knowledge/MathForm';
import CommonForm from '../forms/knowledge/CommonForm';
import VerbalForm from '../forms/knowledge/VerbalForm';
import LogicForm from '../forms/knowledge/LogicForm';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselPrevious,
    CarouselNext,
    CarouselApi,
} from "@/components/ui/carousel";
import { useRef, useState } from 'react';
import type { KnowledgeItem } from "@/types/record";

interface KnowledgeEntryViewProps {
    onAddKnowledge: (knowledge: KnowledgeItem) => void;
    defaultTab?: string;
}

const tabList = [
    { value: 'data-analysis', label: '资料分析' },
    { value: 'politics', label: '政治理论' },
    { value: 'math', label: '数量关系' },
    { value: 'common', label: '常识判断' },
    { value: 'verbal', label: '言语理解' },
    { value: 'logic', label: '判断推理' },
];

const KnowledgeEntryView: React.FC<KnowledgeEntryViewProps> = ({ onAddKnowledge, defaultTab = 'data-analysis' }) => {
    const [tab, setTab] = useState(defaultTab);
    const carouselApi = useRef<CarouselApi | null>(null);
    // 包装函数，自动加上 module 字段
    const handleAdd = (module: string) => (data: Partial<KnowledgeItem>) => {
        onAddKnowledge({ ...data, module } as KnowledgeItem);
    };
    // tab 切换时，carousel 跳转
    const handleTabChange = (v: string) => {
        setTab(v);
        const idx = tabList.findIndex(t => t.value === v);
        if (carouselApi.current) carouselApi.current.scrollTo(idx);
    };
    // carousel 滑动时，tab 跟随
    const handleCarouselApi = (api?: CarouselApi) => {
        if (!api) return;
        carouselApi.current = api;
        api.on('select', () => {
            const idx = api.selectedScrollSnap();
            setTab(tabList[idx].value);
        });
    };
    return (
        <Tabs value={tab} onValueChange={handleTabChange} className="w-full max-w-2xl mx-auto flex flex-col">
            <div className="relative mb-10">
                <TabsList className="flex-nowrap overflow-x-auto scrollbar-hide w-full justify-center text-base h-10 px-1">
                    {tabList.map(({ value, label }) => (
                        <TabsTrigger key={value} value={value}>{label}</TabsTrigger>
                    ))}
                </TabsList>
            </div>
            <Carousel setApi={handleCarouselApi} opts={{ align: 'start', skipSnaps: false, containScroll: 'trimSnaps' }}>
                <CarouselPrevious />
                <CarouselContent>
                    <CarouselItem>
                        <TabsContent value="data-analysis" forceMount>
                            <DataAnalysisForm onAddKnowledge={handleAdd('data-analysis')} />
                        </TabsContent>
                    </CarouselItem>
                    <CarouselItem>
                        <TabsContent value="politics" forceMount>
                            <PoliticsForm onAddKnowledge={handleAdd('politics')} />
                        </TabsContent>
                    </CarouselItem>
                    <CarouselItem>
                        <TabsContent value="math" forceMount>
                            <MathForm onAddKnowledge={handleAdd('math')} />
                        </TabsContent>
                    </CarouselItem>
                    <CarouselItem>
                        <TabsContent value="common" forceMount>
                            <CommonForm onAddKnowledge={handleAdd('common')} />
                        </TabsContent>
                    </CarouselItem>
                    <CarouselItem>
                        <TabsContent value="verbal" forceMount>
                            <VerbalForm onAddKnowledge={handleAdd('verbal')} />
                        </TabsContent>
                    </CarouselItem>
                    <CarouselItem>
                        <TabsContent value="logic" forceMount>
                            <LogicForm onAddKnowledge={handleAdd('logic')} />
                        </TabsContent>
                    </CarouselItem>
                </CarouselContent>
                <CarouselNext />
            </Carousel>
        </Tabs>
    );
};

export default KnowledgeEntryView; 