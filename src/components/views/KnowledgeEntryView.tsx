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
import { MixedText } from '@/components/ui/MixedText';
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
            <CarouselItem className="basis-full pl-0">
                <div className="w-full max-w-lg mx-auto">
                    <ModuleForm module="data-analysis" onAddKnowledge={handleAdd('data-analysis')} />
                </div>
            </CarouselItem>
            <CarouselItem className="basis-full pl-0">
                <div className="w-full max-w-lg mx-auto">
                    <ModuleForm module="politics" onAddKnowledge={handleAdd('politics')} />
                </div>
            </CarouselItem>
            <CarouselItem className="basis-full pl-0">
                <div className="w-full max-w-lg mx-auto">
                    <ModuleForm module="math" onAddKnowledge={handleAdd('math')} />
                </div>
            </CarouselItem>
            <CarouselItem className="basis-full pl-0">
                <div className="w-full max-w-lg mx-auto">
                    <ModuleForm module="common" onAddKnowledge={handleAdd('common')} />
                </div>
            </CarouselItem>
            <CarouselItem className="basis-full pl-0">
                <div className="w-full max-w-lg mx-auto">
                    <ModuleForm module="verbal" onAddKnowledge={handleAdd('verbal')} />
                </div>
            </CarouselItem>
            <CarouselItem className="basis-full pl-0">
                <div className="w-full max-w-lg mx-auto">
                    <ModuleForm module="logic" onAddKnowledge={handleAdd('logic')} />
                </div>
            </CarouselItem>
        </>
    ), [handleAdd]);

    return (
        <div className="w-full flex flex-col items-center knowledge-entry-container">
            <div className="relative mb-4 flex justify-center w-full max-w-full">
                <Tabs value={tab} onValueChange={handleTabChange}>
                    <TabsList className="flex-nowrap overflow-x-auto scrollbar-hide text-base h-12 px-2 w-full max-w-[calc(100vw-2rem)]">
                        {MODULES.map(({ value, label }) => (
                            <TabsTrigger key={value} value={value} className="py-2 whitespace-nowrap data-[state=active]:border data-[state=active]:border-input-border data-[state=active]:bg-white">
                                <MixedText text={label} />
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            </div>

            <div className="w-full flex justify-center">
                <div className="w-full max-w-4xl">
                    <Carousel setApi={handleCarouselApi} className="relative w-full" data-carousel-container opts={{
                        align: 'start',
                        skipSnaps: false,
                        containScroll: 'trimSnaps',
                        duration: 25,
                        dragFree: false,
                        loop: false,
                        slidesToScroll: 1,
                        startIndex: MODULES.findIndex(t => t.value === defaultTab)
                    }}>
                        <CarouselContent className="-ml-0">
                            {carouselContent}
                        </CarouselContent>
                    </Carousel>
                </div>
            </div>
        </div>
    );
};

export default KnowledgeEntryView; 