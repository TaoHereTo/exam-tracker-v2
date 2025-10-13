"use client"

import * as React from "react"
import type { Editor } from "@tiptap/react"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

// --- Icons ---
import { Type } from "lucide-react"

/**
 * Configuration for the font family dropdown menu functionality
 */
export interface UseFontFamilyDropdownMenuConfig {
    /**
     * The Tiptap editor instance.
     */
    editor?: Editor | null
    /**
     * Available font families to show in the dropdown
     * @default ["SimSun, serif", "SimHei, sans-serif", "Microsoft YaHei, sans-serif", "Arial, sans-serif", "Times New Roman, serif", "Courier New, monospace"]
     */
    families?: string[]
    /**
     * Whether the dropdown should hide when font family is not available.
     * @default false
     */
    hideWhenUnavailable?: boolean
}

export interface FontFamilyOption {
    label: string
    value: string
}

export const fontFamilyOptions: FontFamilyOption[] = [
    { label: "默认", value: "" },
    { label: "宋体", value: "SimSun, serif" },
    { label: "黑体", value: "SimHei, sans-serif" },
    { label: "微软雅黑", value: "Microsoft YaHei, sans-serif" },
    { label: "Arial", value: "Arial, sans-serif" },
    { label: "Times New Roman", value: "Times New Roman, serif" },
    { label: "Courier New", value: "Courier New, monospace" },
]

/**
 * Gets the currently active font family from the available families
 */
export function getActiveFontFamily(
    editor: Editor | null,
    families: string[] = ["SimSun, serif", "SimHei, sans-serif", "Microsoft YaHei, sans-serif", "Arial, sans-serif", "Times New Roman, serif", "Courier New, monospace"]
): string | undefined {
    if (!editor || !editor.isEditable) return undefined
    const currentFamily = editor.getAttributes('textStyle').fontFamily || ''
    return families.includes(currentFamily) ? currentFamily : undefined
}

/**
 * Checks if font family formatting can be toggled in the current editor state
 */
export function canToggleFontFamily(editor: Editor | null): boolean {
    if (!editor || !editor.isEditable) return false
    return true // Font family can always be toggled
}

/**
 * Checks if any font family is currently active
 */
export function isFontFamilyActive(editor: Editor | null): boolean {
    if (!editor || !editor.isEditable) return false
    const currentFamily = editor.getAttributes('textStyle').fontFamily || ''
    return currentFamily !== ''
}

/**
 * Custom hook that provides font family dropdown menu functionality for Tiptap editor
 */
export function useFontFamilyDropdownMenu(config?: UseFontFamilyDropdownMenuConfig) {
    const {
        editor: providedEditor,
        families = ["SimSun, serif", "SimHei, sans-serif", "Microsoft YaHei, sans-serif", "Arial, sans-serif", "Times New Roman, serif", "Courier New, monospace"],
        hideWhenUnavailable = false,
    } = config || {}

    const { editor } = useTiptapEditor(providedEditor)
    const [isVisible, setIsVisible] = React.useState(true)

    const activeFamily = getActiveFontFamily(editor, families)
    const isActive = isFontFamilyActive(editor)
    const canToggle = canToggleFontFamily(editor)

    const filteredFamilies = React.useMemo(
        () => fontFamilyOptions.filter(option => !option.value || families.includes(option.value)),
        [families]
    )

    React.useEffect(() => {
        if (!editor) return

        const handleSelectionUpdate = () => {
            setIsVisible(true) // Font family dropdown is always visible
        }

        handleSelectionUpdate()

        editor.on("selectionUpdate", handleSelectionUpdate)

        return () => {
            editor.off("selectionUpdate", handleSelectionUpdate)
        }
    }, [editor])

    return {
        isVisible,
        activeFamily,
        isActive,
        canToggle,
        families,
        filteredFamilies,
        label: "字体",
        Icon: Type,
    }
}
