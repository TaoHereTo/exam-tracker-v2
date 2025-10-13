"use client"

import * as React from "react"

// --- Icons ---
import { ChevronDownIcon } from "@/components/tiptap-icons/chevron-down-icon"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

// --- Tiptap UI ---
import type { UseTextAlignDropdownMenuConfig } from "@/components/tiptap-ui/text-align-dropdown-menu"
import { useTextAlignDropdownMenu } from "@/components/tiptap-ui/text-align-dropdown-menu"

// --- UI Primitives ---
import type { ButtonProps } from "@/components/tiptap-ui-primitive/button"
import { Button, ButtonGroup } from "@/components/tiptap-ui-primitive/button"
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-with-animation"

export interface TextAlignDropdownMenuProps
    extends Omit<ButtonProps, "type">,
    UseTextAlignDropdownMenuConfig {
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
 * Dropdown menu component for selecting text alignments in a Tiptap editor.
 */
export const TextAlignDropdownMenu = React.forwardRef<
    HTMLButtonElement,
    TextAlignDropdownMenuProps
>(
    (
        {
            editor: providedEditor,
            alignments = ["left", "center", "right", "justify"],
            hideWhenUnavailable = false,
            portal = false,
            onOpenChange,
            ...buttonProps
        },
        ref
    ) => {
        const { editor } = useTiptapEditor(providedEditor)
        const [isOpen, setIsOpen] = React.useState(false)
        const { isVisible, isActive, canToggle, filteredAlignments, Icon } = useTextAlignDropdownMenu({
            editor,
            alignments,
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
                        aria-label="设置对齐方式"
                        aria-pressed={isActive}
                        tooltip="对齐方式"
                        {...buttonProps}
                        ref={ref}
                    >
                        <Icon className="tiptap-button-icon" />
                        <ChevronDownIcon className="tiptap-button-dropdown-small" />
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="start" portal={portal}>
                    <ButtonGroup>
                        {filteredAlignments.map((alignment) => {
                            const IconComponent = alignment.icon
                            const currentAlign = editor?.getAttributes('textAlign')?.textAlign || 'left'
                            const isActive = currentAlign === alignment.value

                            return (
                                <DropdownMenuItem
                                    key={`text-align-${alignment.value}`}
                                    asChild
                                >
                                    <Button
                                        type="button"
                                        data-style="ghost"
                                        data-active-state={isActive ? "on" : "off"}
                                        onClick={() => {
                                            editor?.chain().focus().setTextAlign(alignment.value as 'left' | 'center' | 'right' | 'justify').run()
                                        }}
                                        showTooltip={false}
                                    >
                                        <IconComponent className="h-4 w-4 mr-2" />
                                        {alignment.label}
                                    </Button>
                                </DropdownMenuItem>
                            )
                        })}
                    </ButtonGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        )
    }
)

TextAlignDropdownMenu.displayName = "TextAlignDropdownMenu"

export default TextAlignDropdownMenu
