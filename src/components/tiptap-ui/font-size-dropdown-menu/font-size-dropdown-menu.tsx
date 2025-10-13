"use client"

import * as React from "react"

// --- Icons ---
import { ChevronDownIcon } from "@/components/tiptap-icons/chevron-down-icon"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

// --- Tiptap UI ---
import type { UseFontSizeDropdownMenuConfig } from "@/components/tiptap-ui/font-size-dropdown-menu"
import { useFontSizeDropdownMenu } from "@/components/tiptap-ui/font-size-dropdown-menu"

// --- UI Primitives ---
import type { ButtonProps } from "@/components/tiptap-ui-primitive/button"
import { Button, ButtonGroup } from "@/components/tiptap-ui-primitive/button"
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-with-animation"

export interface FontSizeDropdownMenuProps
    extends Omit<ButtonProps, "type">,
    UseFontSizeDropdownMenuConfig {
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
 * Dropdown menu component for selecting font sizes in a Tiptap editor.
 */
export const FontSizeDropdownMenu = React.forwardRef<
    HTMLButtonElement,
    FontSizeDropdownMenuProps
>(
    (
        {
            editor: providedEditor,
            sizes = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px", "36px"],
            hideWhenUnavailable = false,
            portal = false,
            onOpenChange,
            ...buttonProps
        },
        ref
    ) => {
        const { editor } = useTiptapEditor(providedEditor)
        const [isOpen, setIsOpen] = React.useState(false)
        const { isVisible, isActive, canToggle, filteredSizes, Icon } = useFontSizeDropdownMenu({
            editor,
            sizes,
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
                        aria-label="设置字体大小"
                        aria-pressed={isActive}
                        tooltip="字体大小"
                        {...buttonProps}
                        ref={ref}
                    >
                        <Icon className="tiptap-button-icon" />
                        <ChevronDownIcon className="tiptap-button-dropdown-small" />
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="start" portal={portal} className="min-w-[5rem] w-auto">
                    <ButtonGroup>
                        {filteredSizes.map((size) => (
                            <DropdownMenuItem
                                key={`font-size-${size.value}`}
                                asChild
                            >
                                <Button
                                    type="button"
                                    data-style="ghost"
                                    data-active-state={editor?.getAttributes('textStyle').fontSize === size.value ? "on" : "off"}
                                    onClick={() => {
                                        if (size.value) {
                                            editor?.chain().focus().setFontSize(size.value).run()
                                        } else {
                                            editor?.chain().focus().unsetFontSize().run()
                                        }
                                    }}
                                    showTooltip={false}
                                >
                                    {size.label}
                                </Button>
                            </DropdownMenuItem>
                        ))}
                    </ButtonGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        )
    }
)

FontSizeDropdownMenu.displayName = "FontSizeDropdownMenu"

export default FontSizeDropdownMenu
