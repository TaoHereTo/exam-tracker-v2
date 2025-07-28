'use client';

import React from 'react';

interface GlassSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    className?: string;
}

export default function GlassSwitch({
    checked,
    onChange,
    disabled = false,
    className = ''
}: GlassSwitchProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!disabled) {
            onChange(e.target.checked);
        }
    };

    return (
        <div className={`glass-switch-wrapper ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
            <label className="label">
                <div className="toggle">
                    <input
                        className="toggle-state"
                        type="checkbox"
                        checked={checked}
                        onChange={handleChange}
                        disabled={disabled}
                    />
                    <div className="indicator"></div>
                </div>
            </label>

            <style jsx>{`
        /* 玻璃质感开关按钮样式 */
        .label {
            display: inline-flex;
            align-items: center;
            cursor: pointer;
            color: #394a56;
        }

        .toggle {
            isolation: isolate;
            position: relative;
            height: 24px;
            width: 48px;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: -6px -3px 6px 0px #ffffff,
                6px 3px 9px 0px #d1d9e6,
                3px 3px 3px 0px #d1d9e6 inset,
                -3px -3px 3px 0px #ffffff inset;
        }

        .toggle-state {
            display: none;
        }

        .indicator {
            height: 100%;
            width: 200%;
            background: #ecf0f3;
            border-radius: 12px;
            transform: translate3d(-75%, 0, 0);
            transition: transform 0.4s cubic-bezier(0.85, 0.05, 0.18, 1.35);
            box-shadow: -6px -3px 6px 0px #ffffff,
                6px 3px 9px 0px #d1d9e6;
        }

        .toggle-state:checked~.indicator {
            transform: translate3d(25%, 0, 0);
        }
      `}</style>
        </div>
    );
} 