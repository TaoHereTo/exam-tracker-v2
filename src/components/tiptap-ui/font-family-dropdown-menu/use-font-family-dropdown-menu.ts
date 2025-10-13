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
     * @default ["SimSun, serif", "SimHei, sans-serif", "Microsoft YaHei, sans-serif", "Arial, sans-serif", "Times New Roman, serif", "Courier New, monospace", "Georgia, serif", "Verdana, sans-serif", "Helvetica, sans-serif", "KaiTi, serif", "NSimSun, serif", "PingFang SC, sans-serif", "FangSong, serif", "Tahoma, sans-serif", "Trebuchet MS, sans-serif", "Palatino, serif", "Monaco, monospace", "Consolas, monospace"]
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
    // 中文字体 (7个)
    { label: "宋体", value: "SimSun, serif" },
    { label: "黑体", value: "SimHei, sans-serif" },
    { label: "微软雅黑", value: "Microsoft YaHei, sans-serif" },
    { label: "新宋体", value: "NSimSun, serif" },
    { label: "楷体", value: "KaiTi, serif" },
    { label: "苹方", value: "PingFang SC, sans-serif" },
    { label: "仿宋", value: "FangSong, serif" },
    // 英文字体 - 无衬线字体 (5个)
    { label: "Arial", value: "Arial, sans-serif" },
    { label: "Helvetica", value: "Helvetica, sans-serif" },
    { label: "Verdana", value: "Verdana, sans-serif" },
    { label: "Tahoma", value: "Tahoma, sans-serif" },
    { label: "Trebuchet MS", value: "Trebuchet MS, sans-serif" },
    // 英文字体 - 衬线字体 (3个)
    { label: "Times New Roman", value: "Times New Roman, serif" },
    { label: "Georgia", value: "Georgia, serif" },
    { label: "Palatino", value: "Palatino, serif" },
    // 等宽字体 (3个)
    { label: "Courier New", value: "Courier New, monospace" },
    { label: "Monaco", value: "Monaco, monospace" },
    { label: "Consolas", value: "Consolas, monospace" },
]

/**
 * Gets the currently active font family from the available families
 */
export function getActiveFontFamily(
    editor: Editor | null,
    families: string[] = ["SimSun, serif", "SimHei, sans-serif", "Microsoft YaHei, sans-serif", "Arial, sans-serif", "Times New Roman, serif", "Courier New, monospace", "Georgia, serif", "Verdana, sans-serif", "Helvetica, sans-serif", "KaiTi, serif", "NSimSun, serif", "PingFang SC, sans-serif", "FangSong, serif", "Tahoma, sans-serif", "Trebuchet MS, sans-serif", "Palatino, serif", "Monaco, monospace", "Consolas, monospace"]
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
        families = ["SimSun, serif", "SimHei, sans-serif", "Microsoft YaHei, sans-serif", "Arial, sans-serif", "Times New Roman, serif", "Courier New, monospace", "Georgia, serif", "Verdana, sans-serif", "Helvetica, sans-serif", "KaiTi, serif", "NSimSun, serif", "PingFang SC, sans-serif", "FangSong, serif", "Tahoma, sans-serif", "Trebuchet MS, sans-serif", "Palatino, serif", "Monaco, monospace", "Consolas, monospace"],
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
