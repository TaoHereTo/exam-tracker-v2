'use client';

import React from 'react';
import SwitchRenderer from './SwitchRenderer';

interface StyledSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    className?: string;
}

export default function StyledSwitch({
    checked,
    onChange,
    disabled = false,
    className = ''
}: StyledSwitchProps) {
    return (
        <SwitchRenderer
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            className={className}
            previewOnly={false}
        />
    );
} 