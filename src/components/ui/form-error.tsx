import React, { useEffect, useRef, useState } from 'react';
import { useFormContext } from '@/components/forms/BaseForm';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';
import { MixedText } from './MixedText';

interface FormErrorProps {
    error?: string;
    className?: string;
}

export function FormError({ error, className }: FormErrorProps) {
    // 不再显示tooltip-style的错误提示
    return null;
}