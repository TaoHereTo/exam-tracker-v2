'use client';

import React from 'react';
import SwitchRenderer from './SwitchRenderer';

interface PreviewSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    className?: string;
}

export default function PreviewSwitch({
    checked,
    onChange,
    disabled = false,
    className = ''
}: PreviewSwitchProps) {
    return (
        <SwitchRenderer
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            className={className}
            previewOnly={true}
        />
    );
} 