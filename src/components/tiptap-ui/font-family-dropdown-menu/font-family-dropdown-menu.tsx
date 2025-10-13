"use client"

import * as React from "react"

// --- Icons ---
import { ChevronDownIcon } from "@/components/tiptap-icons/chevron-down-icon"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

// --- Tiptap UI ---
import type { UseFontFamilyDropdownMenuConfig } from "@/components/tiptap-ui/font-family-dropdown-menu"
import { useFontFamilyDropdownMenu } from "@/components/tiptap-ui/font-family-dropdown-menu"

// --- UI Primitives ---
import type { ButtonProps } from "@/components/tiptap-ui-primitive/button"
import { Button, ButtonGroup } from "@/components/tiptap-ui-primitive/button"
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-with-animation"

export interface FontFamilyDropdownMenuProps
    extends Omit<ButtonProps, "type">,
    UseFontFamilyDropdownMenuConfig {
    /**
     * Whether to render the dropdown menu in a portal
     * @default false
     */
    portal?: boolean
    /**
     * Callback for when the dropdown opens or closes
     */
    onOpenChange?: (isOpen: boolean) => void
}

/**
 * Dropdown menu component for selecting font families in a Tiptap editor.
 */
export const FontFamilyDropdownMenu = React.forwardRef<
    HTMLButtonElement,
    FontFamilyDropdownMenuProps
>(
    (
        {
            editor: providedEditor,
            families = ["SimSun, serif", "SimHei, sans-serif", "Microsoft YaHei, sans-serif", "Arial, sans-serif", "Times New Roman, serif", "Courier New, monospace"],
            hideWhenUnavailable = false,
            portal = false,
            onOpenChange,
            ...buttonProps
        },
        ref
    ) => {
        const { editor } = useTiptapEditor(providedEditor)
        const [isOpen, setIsOpen] = React.useState(false)
        const { isVisible, isActive, canToggle, filteredFamilies, Icon } = useFontFamilyDropdownMenu({
            editor,
            families,
            hideWhenUnavailable,
        })

        const handleOpenChange = React.useCallback(
            (open: boolean) => {
                if (!editor || !canToggle) return
                setIsOpen(open)
                onOpenChange?.(open)
            },
            [canToggle, editor, onOpenChange]
        )

        if (!isVisible) {
            return null
        }

        return (
            <DropdownMenu modal open={isOpen} onOpenChange={handleOpenChange}>
                <DropdownMenuTrigger asChild>
                    <Button
                        type="button"
                        data-style="ghost"
                        data-active-state={isActive ? "on" : "off"}
                        role="button"
                        tabIndex={-1}
                        disabled={!canToggle}
                        data-disabled={!canToggle}
                        aria-label="设置字体"
                        aria-pressed={isActive}
                        tooltip="字体"
                        {...buttonProps}
                        ref={ref}
                    >
                        <Icon className="tiptap-button-icon" />
                        <ChevronDownIcon className="tiptap-button-dropdown-small" />
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="start" portal={portal}>
                    <ButtonGroup>
                        {filteredFamilies.map((family) => (
                            <DropdownMenuItem
                                key={`font-family-${family.value}`}
                                asChild
                            >
                                <Button
                                    type="button"
                                    data-style="ghost"
                                    data-active-state={editor?.getAttributes('textStyle').fontFamily === family.value ? "on" : "off"}
                                    onClick={() => {
                                        if (family.value) {
                                            editor?.chain().focus().setFontFamily(family.value).run()
                                        } else {
                                            editor?.chain().focus().unsetFontFamily().run()
                                        }
                                    }}
                                    showTooltip={false}
                                >
                                    <span style={{ fontFamily: family.value || 'inherit' }}>
                                        {family.label}
                                    </span>
                                </Button>
                            </DropdownMenuItem>
                        ))}
                    </ButtonGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        )
    }
)

FontFamilyDropdownMenu.displayName = "FontFamilyDropdownMenu"

export default FontFamilyDropdownMenu
