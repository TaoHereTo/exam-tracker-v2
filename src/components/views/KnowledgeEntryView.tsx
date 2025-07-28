import React, { useRef, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselPrevious,
    CarouselNext,
    CarouselApi,
} from "@/components/ui/carousel";
import ModuleForm from '../forms/ModuleForm';
import VerbalForm from '../forms/VerbalForm';
import PoliticsForm from '../forms/PoliticsForm';
import type { KnowledgeItem } from "@/types/record";
import { MODULES } from "@/config/exam";

interface KnowledgeEntryViewProps {
    onAddKnowledge: (knowledge: KnowledgeItem) => void;
    defaultTab?: string;
}

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
        const idx = MODULES.findIndex(t => t.value === v);
        if (carouselApi.current) carouselApi.current.scrollTo(idx);
    };

    // carousel 滑动时，tab 跟随
    const handleCarouselApi = (api?: CarouselApi) => {
        if (!api) return;
        carouselApi.current = api;
        api.on('select', () => {
            const idx = api.selectedScrollSnap();
            setTab(MODULES[idx].value);
        });
    };

    return (
        <Tabs value={tab} onValueChange={handleTabChange} className="w-full max-w-2xl mx-auto flex flex-col">
            <div className="relative mb-10">
                <TabsList className="flex-nowrap overflow-x-auto scrollbar-hide w-full justify-center text-base h-10 px-1">
                    {MODULES.map(({ value, label }) => (
                        <TabsTrigger key={value} value={value}>{label}</TabsTrigger>
                    ))}
                </TabsList>
            </div>
            <Carousel setApi={handleCarouselApi} opts={{ align: 'start', skipSnaps: false, containScroll: 'trimSnaps' }}>
                <CarouselPrevious />
                <CarouselContent>
                    <CarouselItem>
                        <TabsContent value="data-analysis">
                            <ModuleForm module="data-analysis" onAddKnowledge={handleAdd('data-analysis')} />
                        </TabsContent>
                    </CarouselItem>
                    <CarouselItem>
                        <TabsContent value="politics">
                            <PoliticsForm onAddKnowledge={handleAdd('politics')} />
                        </TabsContent>
                    </CarouselItem>
                    <CarouselItem>
                        <TabsContent value="math">
                            <ModuleForm module="math" onAddKnowledge={handleAdd('math')} />
                        </TabsContent>
                    </CarouselItem>
                    <CarouselItem>
                        <TabsContent value="common">
                            <ModuleForm module="common" onAddKnowledge={handleAdd('common')} />
                        </TabsContent>
                    </CarouselItem>
                    <CarouselItem>
                        <TabsContent value="verbal">
                            <VerbalForm onAddKnowledge={handleAdd('verbal')} />
                        </TabsContent>
                    </CarouselItem>
                    <CarouselItem>
                        <TabsContent value="logic">
                            <ModuleForm module="logic" onAddKnowledge={handleAdd('logic')} />
                        </TabsContent>
                    </CarouselItem>
                </CarouselContent>
                <CarouselNext />
            </Carousel>
        </Tabs>
    );
};

export default KnowledgeEntryView; 