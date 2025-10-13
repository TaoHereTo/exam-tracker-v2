"use client"

import * as React from "react"
import type { Editor } from "@tiptap/react"
import { useHotkeys } from "react-hotkeys-hook"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

// --- Icons ---
import { BlockquoteIcon } from "@/components/tiptap-icons/blockquote-icon"

// --- UI Utils ---
import { isNodeInSchema } from "@/lib/tiptap-utils"

export const BLOCKQUOTE_SHORTCUT_KEY = "mod+shift+b"

/**
 * Configuration for the blockquote functionality
 */
export interface UseBlockquoteConfig {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null
  /**
   * Callback function called after a successful toggle.
   */
  onToggled?: () => void
}

/**
 * Checks if blockquote can be toggled in the current editor state
 */
export function canToggleBlockquote(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false

  // 使用官方文档中的检查方法
  return editor.can().setBlockquote()
}

/**
 * Toggles blockquote formatting for a specific node or the current selection
 */
export function toggleBlockquote(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false

  try {
    // 使用官方文档中的命令
    if (editor.isActive('blockquote')) {
      editor.commands.unsetBlockquote()
    } else {
      editor.commands.setBlockquote()
    }
    return true
  } catch {
    return false
  }
}

/**
 * Determines if the blockquote button should be shown
 */
export function shouldShowButton(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false
  if (!isNodeInSchema("blockquote", editor)) return false
  return true
}

/**
 * Custom hook that provides blockquote functionality for Tiptap editor
 *
 * @example
 * ```tsx
 * // Simple usage - no params needed
 * function MySimpleBlockquoteButton() {
 *   const { isVisible, handleToggle, isActive } = useBlockquote()
 *
 *   if (!isVisible) return null
 *
 *   return <button onClick={handleToggle}>Blockquote</button>
 * }
 *
 * // Advanced usage with configuration
 * function MyAdvancedBlockquoteButton() {
 *   const { isVisible, handleToggle, label, isActive } = useBlockquote({
 *     editor: myEditor,
 *     hideWhenUnavailable: true,
 *     onToggled: () => console.log('Blockquote toggled!')
 *   })
 *
 *   if (!isVisible) return null
 *
 *   return (
 *     <MyButton
 *       onClick={handleToggle}
 *       aria-label={label}
 *       aria-pressed={isActive}
 *     >
 *       Toggle Blockquote
 *     </MyButton>
 *   )
 * }
 * ```
 */
export function useBlockquote(config?: UseBlockquoteConfig) {
  const {
    editor: providedEditor,
    onToggled,
  } = config || {}

  const { editor } = useTiptapEditor(providedEditor)
  const canToggle = canToggleBlockquote(editor)
  const isActive = editor?.isActive("blockquote") || false
  const isVisible = shouldShowButton(editor)

  const handleToggle = React.useCallback(() => {
    if (!editor) return false

    const success = toggleBlockquote(editor)
    if (success) {
      onToggled?.()
    }
    return success
  }, [editor, onToggled])

  // 注册键盘快捷键
  useHotkeys(
    BLOCKQUOTE_SHORTCUT_KEY,
    (event) => {
      event.preventDefault()
      if (editor && canToggle) {
        handleToggle()
      }
    },
    {
      enableOnFormTags: true,
      preventDefault: true,
    },
    [editor, canToggle, handleToggle]
  )

  return {
    isVisible,
    isActive,
    handleToggle,
    canToggle,
    label: "引用",
    shortcutKeys: BLOCKQUOTE_SHORTCUT_KEY,
    Icon: BlockquoteIcon,
  }
}
