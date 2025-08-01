import React, { useRef, useState, useCallback, useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselPrevious,
    CarouselNext,
    CarouselApi,
} from "@/components/ui/carousel";
import ModuleForm from '@/components/forms/ModuleForm';
import VerbalForm from '@/components/forms/VerbalForm';
import PoliticsForm from '@/components/forms/PoliticsForm';
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
    const handleAdd = useCallback((module: string) => (data: Partial<KnowledgeItem>) => {
        onAddKnowledge({ ...data, module } as KnowledgeItem);
    }, [onAddKnowledge]);

    // tab 切换时，carousel 跳转
    const handleTabChange = useCallback((v: string) => {
        setTab(v);
        const idx = MODULES.findIndex(t => t.value === v);
        if (carouselApi.current) {
            carouselApi.current.scrollTo(idx);
        }
    }, []);

    // carousel 滑动时，tab 跟随
    const handleCarouselApi = useCallback((api?: CarouselApi) => {
        if (!api) return;
        carouselApi.current = api;

        api.on('select', () => {
            // 使用 requestAnimationFrame 确保在下一帧更新，避免干扰动画
            requestAnimationFrame(() => {
                const idx = api.selectedScrollSnap();
                if (MODULES[idx]) {
                    setTab(MODULES[idx].value);
                }
            });
        });
    }, []);

    // 使用 useMemo 优化轮播内容，避免不必要的重新渲染
    const carouselContent = useMemo(() => (
        <>
            <CarouselItem data-carousel-item data-active={tab === 'data-analysis'}>
                <div className="p-1">
                    <ModuleForm module="data-analysis" onAddKnowledge={handleAdd('data-analysis')} />
                </div>
            </CarouselItem>
            <CarouselItem data-carousel-item data-active={tab === 'politics'}>
                <div className="p-1">
                    <PoliticsForm onAddKnowledge={handleAdd('politics')} />
                </div>
            </CarouselItem>
            <CarouselItem data-carousel-item data-active={tab === 'math'}>
                <div className="p-1">
                    <ModuleForm module="math" onAddKnowledge={handleAdd('math')} />
                </div>
            </CarouselItem>
            <CarouselItem data-carousel-item data-active={tab === 'common'}>
                <div className="p-1">
                    <ModuleForm module="common" onAddKnowledge={handleAdd('common')} />
                </div>
            </CarouselItem>
            <CarouselItem data-carousel-item data-active={tab === 'verbal'}>
                <div className="p-1">
                    <VerbalForm onAddKnowledge={handleAdd('verbal')} />
                </div>
            </CarouselItem>
            <CarouselItem data-carousel-item data-active={tab === 'logic'}>
                <div className="p-1">
                    <ModuleForm module="logic" onAddKnowledge={handleAdd('logic')} />
                </div>
            </CarouselItem>
        </>
    ), [handleAdd, tab]);

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col">
            <div className="relative mb-10">
                <Tabs value={tab} onValueChange={handleTabChange}>
                    <TabsList className="flex-nowrap overflow-x-auto scrollbar-hide w-full justify-center text-base h-10 px-1">
                        {MODULES.map(({ value, label }) => (
                            <TabsTrigger key={value} value={value}>{label}</TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            </div>

            <Carousel setApi={handleCarouselApi} className="relative px-12" data-carousel-container opts={{
                align: 'start',
                skipSnaps: false,
                containScroll: 'trimSnaps',
                duration: 25,
                dragFree: false,
                loop: false,
                slidesToScroll: 1,
                startIndex: MODULES.findIndex(t => t.value === defaultTab)
            }}>
                <CarouselPrevious />
                <CarouselContent>
                    {carouselContent}
                </CarouselContent>
                <CarouselNext />
            </Carousel>
        </div>
    );
};

export default KnowledgeEntryView; 