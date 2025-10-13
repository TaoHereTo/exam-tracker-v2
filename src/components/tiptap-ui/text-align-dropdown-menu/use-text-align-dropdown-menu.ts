"use client"

import * as React from "react"
import type { Editor } from "@tiptap/react"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

// --- Icons ---
import { AlignLeft, AlignCenter, AlignRight, AlignJustify } from "lucide-react"

/**
 * Configuration for the text align dropdown menu functionality
 */
export interface UseTextAlignDropdownMenuConfig {
    /**
     * The Tiptap editor instance.
     */
    editor?: Editor | null
    /**
     * Available text alignments to show in the dropdown
     * @default ["left", "center", "right", "justify"]
     */
    alignments?: string[]
    /**
     * Whether the dropdown should hide when text alignment is not available.
     * @default false
     */
    hideWhenUnavailable?: boolean
}

export interface TextAlignOption {
    label: string
    value: string
    icon: React.ElementType
}

export const textAlignOptions: TextAlignOption[] = [
    { label: "左对齐", value: "left", icon: AlignLeft },
    { label: "居中", value: "center", icon: AlignCenter },
    { label: "右对齐", value: "right", icon: AlignRight },
    { label: "两端对齐", value: "justify", icon: AlignJustify },
]

/**
 * Gets the currently active text alignment from the available alignments
 */
export function getActiveTextAlign(
    editor: Editor | null,
    alignments: string[] = ["left", "center", "right", "justify"]
): string | undefined {
    if (!editor || !editor.isEditable) return undefined
    const currentAlign = editor.getAttributes('textAlign')?.textAlign || 'left'
    return alignments.includes(currentAlign) ? currentAlign : undefined
}

/**
 * Checks if text alignment formatting can be toggled in the current editor state
 */
export function canToggleTextAlign(editor: Editor | null): boolean {
    if (!editor || !editor.isEditable) return false
    return true // Text alignment can always be toggled
}

/**
 * Checks if any text alignment is currently active
 */
export function isTextAlignActive(editor: Editor | null): boolean {
    if (!editor || !editor.isEditable) return false
    const currentAlign = editor.getAttributes('textAlign')?.textAlign || 'left'
    return currentAlign !== 'left' // left is default, so we consider it inactive
}

/**
 * Gets the icon for the current text alignment
 */
export function getCurrentAlignIcon(editor: Editor | null): React.ElementType {
    if (!editor || !editor.isEditable) return AlignLeft
    const currentAlign = editor.getAttributes('textAlign')?.textAlign || 'left'
    const option = textAlignOptions.find(opt => opt.value === currentAlign)
    return option?.icon || AlignLeft
}

/**
 * Custom hook that provides text align dropdown menu functionality for Tiptap editor
 */
export function useTextAlignDropdownMenu(config?: UseTextAlignDropdownMenuConfig) {
    const {
        editor: providedEditor,
        alignments = ["left", "center", "right", "justify"],
        hideWhenUnavailable = false,
    } = config || {}

    const { editor } = useTiptapEditor(providedEditor)
    const [isVisible, setIsVisible] = React.useState(true)

    const activeAlign = getActiveTextAlign(editor, alignments)
    const isActive = isTextAlignActive(editor)
    const canToggle = canToggleTextAlign(editor)
    const currentIcon = getCurrentAlignIcon(editor)

    const filteredAlignments = React.useMemo(
        () => textAlignOptions.filter(option => alignments.includes(option.value)),
        [alignments]
    )

    React.useEffect(() => {
        if (!editor) return

        const handleSelectionUpdate = () => {
            setIsVisible(true) // Text align dropdown is always visible
        }

        handleSelectionUpdate()

        editor.on("selectionUpdate", handleSelectionUpdate)

        return () => {
            editor.off("selectionUpdate", handleSelectionUpdate)
        }
    }, [editor])

    return {
        isVisible,
        activeAlign,
        isActive,
        canToggle,
        alignments,
        filteredAlignments,
        currentIcon,
        label: "对齐方式",
        Icon: currentIcon,
    }
}
