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
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const checkContentHeight = () => {
            if (contentRef.current) {
                const element = contentRef.current;
                const lineHeight = parseFloat(getComputedStyle(element).lineHeight) || 20; // 默认行高
                const maxHeight = lineHeight * maxLines;

                // 临时设置为不限制高度来测量实际高度
                element.style.maxHeight = 'none';
                element.style.overflow = 'visible';
                const actualHeight = element.scrollHeight;

                // 恢复原始样式
                element.style.maxHeight = '';
                element.style.overflow = '';

                setNeedsExpansion(actualHeight > maxHeight);
            }
        };

        // 延迟检查，确保内容已渲染
        const timer = setTimeout(checkContentHeight, 100);
        return () => clearTimeout(timer);
    }, [content, maxLines]);

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div className={cn('relative', className)}>
            <div
                ref={contentRef}
                className={cn(
                    'text-sm leading-relaxed transition-all duration-300 ease-in-out',
                    !isExpanded && needsExpansion && 'overflow-hidden'
                )}
                style={{
                    maxHeight: !isExpanded && needsExpansion ? `${maxLines * 1.5}em` : 'none',
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: !isExpanded && needsExpansion ? maxLines : 'unset',
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
                        className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                        {isExpanded ? (
                            <>
                                <ChevronUp className="w-3 h-3 mr-1" />
                                {collapseText}
                            </>
                        ) : (
                            <>
                                <ChevronDown className="w-3 h-3 mr-1" />
                                {expandText}
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
};
