'use client';

import React from 'react';
import { Switch } from '@/components/ui/switch';
import SparkleSwitch from './SparkleSwitch';
import ThreeDSwitch from './ThreeDSwitch';
import GlassSwitch from './GlassSwitch';
import PlaneSwitch from './PlaneSwitch';
import { useSwitchStyle } from '@/contexts/SwitchStyleContext';

interface SwitchRendererProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    className?: string;
    previewOnly?: boolean;
}

export default function SwitchRenderer({
    checked,
    onChange,
    disabled = false,
    className = '',
    previewOnly = false
}: SwitchRendererProps) {
    const { otherSwitchType } = useSwitchStyle();

    const handleChange = (newChecked: boolean) => {
        onChange(newChecked);
    };

    switch (otherSwitchType) {
        case 'sparkle':
            return (
                <SparkleSwitch
                    checked={checked}
                    onChange={handleChange}
                    disabled={disabled}
                    className={className}
                    previewOnly={previewOnly}
                />
            );
        case '3d':
            return (
                <ThreeDSwitch
                    checked={checked}
                    onChange={handleChange}
                    disabled={disabled}
                    className={className}
                    previewOnly={previewOnly}
                />
            );
        case 'glass':
            return (
                <GlassSwitch
                    checked={checked}
                    onChange={handleChange}
                    disabled={disabled}
                    className={className}
                />
            );
        case 'plane':
            return (
                <PlaneSwitch
                    checked={checked}
                    onChange={handleChange}
                    disabled={disabled}
                    className={className}
                />
            );
        default:
            return (
                <Switch
                    checked={checked}
                    onCheckedChange={handleChange}
                    disabled={disabled}
                    className={className}
                />
            );
    }
} 