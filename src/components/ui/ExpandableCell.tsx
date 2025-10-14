import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExpandableCellProps {
    content: React.ReactNode;
    maxLines?: number;
    className?: string;
    expandText?: string;
    collapseText?: string;
}

export const ExpandableCell: React.FC<ExpandableCellProps> = ({
    content,
    maxLines = 6,
    className = '',
    expandText = '展开',
    collapseText = '收起'
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [needsExpansion, setNeedsExpansion] = useState(false);
    const [contentHeight, setContentHeight] = useState<number>(0);
    const [collapsedHeight, setCollapsedHeight] = useState<number>(0);
    const contentRef = useRef<HTMLDivElement>(null);
    const measureRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const measureContent = () => {
            if (measureRef.current && contentRef.current) {
                // 确保测量元素有正确的宽度
                const containerWidth = contentRef.current.offsetWidth;
                measureRef.current.style.width = `${containerWidth}px`;

                // 测量完整内容的高度
                const fullHeight = measureRef.current.scrollHeight;
                const lineHeight = parseFloat(getComputedStyle(measureRef.current).lineHeight) || 20;
                const maxHeight = lineHeight * maxLines;

                // 添加一些额外的像素来确保内容完全显示
                const adjustedFullHeight = fullHeight + 10; // 添加10px缓冲

                setContentHeight(adjustedFullHeight);
                setCollapsedHeight(maxHeight);
                setNeedsExpansion(fullHeight > maxHeight);
            }
        };

        // 多次测量确保内容完全渲染
        const timer1 = setTimeout(measureContent, 100);
        const timer2 = setTimeout(measureContent, 500);
        const timer3 = setTimeout(measureContent, 1000);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, [content, maxLines]);

    // 监听窗口大小变化，重新测量
    useEffect(() => {
        const handleResize = () => {
            if (measureRef.current && contentRef.current) {
                const containerWidth = contentRef.current.offsetWidth;
                measureRef.current.style.width = `${containerWidth}px`;

                const fullHeight = measureRef.current.scrollHeight;
                const adjustedFullHeight = fullHeight + 10;
                setContentHeight(adjustedFullHeight);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);

        // 展开时重新测量高度，确保内容完全显示
        if (!isExpanded && measureRef.current) {
            setTimeout(() => {
                if (measureRef.current) {
                    const fullHeight = measureRef.current.scrollHeight;
                    const adjustedFullHeight = fullHeight + 15; // 增加更多缓冲
                    setContentHeight(adjustedFullHeight);
                }
            }, 50);
        }
    };

    return (
        <div className={cn('relative', className)}>
            {/* 隐藏的测量元素 */}
            <div
                ref={measureRef}
                className="absolute opacity-0 pointer-events-none text-sm leading-relaxed"
                style={{
                    width: '100%',
                    zIndex: -1,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    visibility: 'hidden'
                }}
            >
                {content}
            </div>

            {/* 实际显示的内容 */}
            <div
                ref={contentRef}
                className="expandable-cell-content text-sm leading-relaxed overflow-hidden"
                style={{
                    maxHeight: isExpanded ? `${contentHeight}px` : `${collapsedHeight}px`,
                }}
            >
                {content}
            </div>

            {needsExpansion && (
                <div className="mt-2 flex justify-end">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleExpanded}
                        className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground transition-colors duration-300"
                    >
                        {isExpanded ? (
                            <>
                                <ChevronUp className="w-3 h-3 mr-1 transition-transform duration-300" />
                                {collapseText}
                            </>
                        ) : (
                            <>
                                <ChevronDown className="w-3 h-3 mr-1 transition-transform duration-300" />
                                {expandText}
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
};
