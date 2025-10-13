"use client"

import * as React from "react"
import type { Editor } from "@tiptap/react"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

// --- Icons ---
import { TypeOutline } from "lucide-react"

/**
 * Configuration for the font size dropdown menu functionality
 */
export interface UseFontSizeDropdownMenuConfig {
    /**
     * The Tiptap editor instance.
     */
    editor?: Editor | null
    /**
     * Available font sizes to show in the dropdown
     * @default ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px", "36px"]
     */
    sizes?: string[]
    /**
     * Whether the dropdown should hide when font size is not available.
     * @default false
     */
    hideWhenUnavailable?: boolean
}

export interface FontSizeOption {
    label: string
    value: string
}

export const fontSizeOptions: FontSizeOption[] = [
    { label: "默认", value: "" },
    { label: "12px", value: "12px" },
    { label: "14px", value: "14px" },
    { label: "16px", value: "16px" },
    { label: "18px", value: "18px" },
    { label: "20px", value: "20px" },
    { label: "24px", value: "24px" },
    { label: "28px", value: "28px" },
    { label: "32px", value: "32px" },
    { label: "36px", value: "36px" },
]

/**
 * Gets the currently active font size from the available sizes
 */
export function getActiveFontSize(
    editor: Editor | null,
    sizes: string[] = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px", "36px"]
): string | undefined {
    if (!editor || !editor.isEditable) return undefined
    const currentSize = editor.getAttributes('textStyle').fontSize || ''
    return sizes.includes(currentSize) ? currentSize : undefined
}

/**
 * Checks if font size formatting can be toggled in the current editor state
 */
export function canToggleFontSize(editor: Editor | null): boolean {
    if (!editor || !editor.isEditable) return false
    return true // Font size can always be toggled
}

/**
 * Checks if any font size is currently active
 */
export function isFontSizeActive(editor: Editor | null): boolean {
    if (!editor || !editor.isEditable) return false
    const currentSize = editor.getAttributes('textStyle').fontSize || ''
    return currentSize !== ''
}

/**
 * Custom hook that provides font size dropdown menu functionality for Tiptap editor
 */
export function useFontSizeDropdownMenu(config?: UseFontSizeDropdownMenuConfig) {
    const {
        editor: providedEditor,
        sizes = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px", "36px"],
        hideWhenUnavailable = false,
    } = config || {}

    const { editor } = useTiptapEditor(providedEditor)
    const [isVisible, setIsVisible] = React.useState(true)

    const activeSize = getActiveFontSize(editor, sizes)
    const isActive = isFontSizeActive(editor)
    const canToggle = canToggleFontSize(editor)

    const filteredSizes = React.useMemo(
        () => fontSizeOptions.filter(option => !option.value || sizes.includes(option.value)),
        [sizes]
    )

    React.useEffect(() => {
        if (!editor) return

        const handleSelectionUpdate = () => {
            setIsVisible(true) // Font size dropdown is always visible
        }

        handleSelectionUpdate()

        editor.on("selectionUpdate", handleSelectionUpdate)

        return () => {
            editor.off("selectionUpdate", handleSelectionUpdate)
        }
    }, [editor])

    return {
        isVisible,
        activeSize,
        isActive,
        canToggle,
        sizes,
        filteredSizes,
        label: "字体大小",
        Icon: TypeOutline,
    }
}
