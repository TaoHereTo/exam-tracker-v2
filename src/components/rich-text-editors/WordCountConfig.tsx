'use client';

import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/animate-ui/components/radix/checkbox';
import { Label } from '@/components/ui/label';

interface WordCountConfigProps {
    wordCount: number;
    charCount: number;
    selectedWordCount: number;
    selectedCharCount: number;
    includePunctuation: boolean;
    setIncludePunctuation: (include: boolean) => void;
    showWordCountOptions: boolean;
    setShowWordCountOptions: (show: boolean) => void;
}

export const WordCountConfig: React.FC<WordCountConfigProps> = ({
    wordCount,
    charCount,
    selectedWordCount,
    selectedCharCount,
    includePunctuation,
    setIncludePunctuation,
    showWordCountOptions,
    setShowWordCountOptions
}) => {
    return (
        <Popover open={showWordCountOptions} onOpenChange={setShowWordCountOptions}>
            <PopoverTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 rounded px-2 py-0.5 transition-colors">
                    {selectedWordCount > 0 ? (
                        <>
                            <span className="text-blue-600 dark:text-blue-400">选中字数: {selectedWordCount}</span>
                            <span className="text-blue-600 dark:text-blue-400">选中字符: {selectedCharCount}</span>
                        </>
                    ) : (
                        <>
                            <span>字数: {wordCount}</span>
                            <span>字符: {charCount}</span>
                        </>
                    )}
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-48" align="end">
                <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="include-punctuation"
                            checked={includePunctuation}
                            onCheckedChange={(checked) => setIncludePunctuation(checked as boolean)}
                        />
                        <Label
                            htmlFor="include-punctuation"
                            className="text-sm font-normal cursor-pointer"
                        >
                            标点符号算作1字
                        </Label>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};
