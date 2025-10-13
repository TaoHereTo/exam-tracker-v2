好的，当然。

根据你提供的最新官方文档，这里是一份为你量身打造的、全新的、使用 Markdown 格式的 Tiptap `BubbleMenu` 实践指南。这份指南完全基于你 **React / Next.js + TypeScript** 的技术栈，并使用了最新的 `Floating UI` 配置。

-----

# Tiptap Bubble Menu 最新实践指南 (React & TypeScript)

`BubbleMenu`（气泡菜单）是一个上下文菜单，当用户选中一段文本时，它会优雅地浮现在选区附近。本指南将带你从零开始，构建一个功能完善且高度自定义的气泡菜单。

## 核心概念

  - **分离的逻辑与视图**: `BubbleMenu` 分为两部分：在编辑器配置中启用的**扩展 (Extension)** 和在 JSX 中使用的 **React 组件**。
  - **强大的定位**: 最新版本使用 [Floating UI](https://floating-ui.com/) 进行定位，提供了极其灵活的位置控制。
  - **完全的显示控制**: 通过 `shouldShow` 属性，你可以用代码精确定义菜单在何时、何地、何种条件下出现。

-----

## 步骤一：安装依赖

首先，确保你已经安装了所有必要的 Tiptap 包。

```bash
# 使用 npm
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-bubble-menu

# 或者使用 yarn
yarn add @tiptap/react @tiptap/starter-kit @tiptap/extension-bubble-menu
```

  - `@tiptap/react`: 提供 React 绑定 (`useEditor` Hook) 和 UI 组件 (`BubbleMenu`, `EditorContent`)。
  - `@tiptap/starter-kit`: 包含一组常用的基础扩展。
  - `@tiptap/extension-bubble-menu`: 提供 `BubbleMenu` 的核心逻辑。

-----

## 步骤二：配置 Editor 实例

在你使用 `useEditor` Hook 初始化编辑器的地方，将 `BubbleMenu` 扩展添加到 `extensions` 数组中。

> **注意**：这一步只是为了“激活”`BubbleMenu` 的功能，它并不会渲染任何可见的 UI。

```tsx
// src/components/MyTiptapEditor.tsx

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import BubbleMenuExtension from '@tiptap/extension-bubble-menu';

const MyTiptapEditor = () => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      // 在这里启用扩展
      BubbleMenuExtension.configure({
        // pluginKey 是可选的，但在使用多个菜单时是必需的
        pluginKey: 'bubbleMenu',
      }),
    ],
    content: '<p>选中这段文字，查看效果！</p>',
  });

  // ...接下来的代码
};
```

-----

## 步骤三：在组件中使用 `<BubbleMenu>`

现在，导入 `<BubbleMenu>` 组件，并将它与你的 `EditorContent` 一起放置。

这是最关键的一步，我们将在这里定义菜单的**外观**和**行为**。

```tsx
// src/components/MyTiptapEditor.tsx (续)

// 别忘了从 @tiptap/react 导入 BubbleMenu 组件
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
// ... 其他 import

const MyTiptapEditor = () => {
  const editor = useEditor({ /* ...之前的配置... */ });

  if (!editor) {
    return null;
  }

  return (
    <div>
      {/* BubbleMenu 组件 */}
      <BubbleMenu
        editor={editor}
        // pluginKey 需要和 configure 中的一致
        pluginKey="bubbleMenu"
        // 这是最新的定位配置，基于 Floating UI
        options={{
          placement: 'top-start', // 菜单显示在选区上方偏左的位置
        }}
        // 更新延迟，避免菜单在选择过程中闪烁
        updateDelay={250}
      >
        {/* 在这里放置你的菜单 UI */}
        <div className="bubble-menu-container">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'is-active' : ''}
          >
            Bold
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'is-active' : ''}
          >
            Italic
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={editor.isActive('strike') ? 'is-active' : ''}
          >
            Strike
          </button>
        </div>
      </BubbleMenu>

      <EditorContent editor={editor} />
    </div>
  );
};
```

-----

## 步骤四：添加 CSS 样式

一个没有样式的菜单是不可用的。创建一个 CSS 文件并添加以下样式，让菜单看起来更专业。

```css
/* src/styles/editor.css */

.ProseMirror {
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  min-height: 250px;
}
.ProseMirror:focus {
  outline: 2px solid #3b82f6;
  border-color: transparent;
}

.bubble-menu-container {
  display: flex;
  background-color: #1f2937; /* 深灰色背景 */
  padding: 0.25rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}

.bubble-menu-container button {
  border: none;
  background: none;
  color: #f9fafb; /* 亮白色文字 */
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0.25rem 0.75rem;
  margin: 0 0.125rem;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}

.bubble-menu-container button:hover {
  background-color: #4b5563; /* 悬停时变色 */
}

/* 激活状态的按钮样式 */
.bubble-menu-container button.is-active {
  background-color: #3b82f6; /* 蓝色背景 */
  color: #ffffff;
}
```

-----

## 步骤五：使用 `shouldShow` 实现高级控制

这是 `BubbleMenu` 的精髓所在。你可以通过 `shouldShow` 属性传递一个函数，来决定菜单是否应该显示。

**常见场景：只在用户确实选中文本时（而不是只有一个闪烁的光标时）显示菜单。**

```tsx
<BubbleMenu
  editor={editor}
  pluginKey="bubbleMenu"
  options={{ placement: 'top' }}
  shouldShow={({ state, from, to }) => {
    // 获取选区内容
    const { doc } = state;
    const text = doc.textBetween(from, to, ' ');

    // 当选区不为空（即不是一个光标）并且包含一些可见字符时，才显示菜单
    return from !== to && text.trim().length > 0;
  }}
>
  {/* ... 菜单内容 ... */}
</BubbleMenu>
```

### `shouldShow` 函数的参数

| 参数     | 类型             | 描述                                     |
| :------- | :--------------- | :--------------------------------------- |
| `editor` | `Editor`         | Tiptap 编辑器实例。                      |
| `view`   | `EditorView`     | 底层的 ProseMirror 视图实例。            |
| `state`  | `EditorState`    | 编辑器的当前状态，包含文档、选区等信息。 |
| `from`   | `number`         | 选区的起始位置。                         |
| `to`     | `number`         | 选区的结束位置。                         |

-----

## 完整代码示例

将所有部分组合在一起，你会得到一个功能齐全的编辑器组件。

```tsx
// src/components/TiptapWithBubbleMenu.tsx

import React from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import BubbleMenuExtension from '@tiptap/extension-bubble-menu';

// 引入你的样式
import '../styles/editor.css';

const TiptapWithBubbleMenu = () => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      BubbleMenuExtension.configure({
        pluginKey: 'bubbleMenu',
      }),
    ],
    content: `
      <h2>你好，这里是 Bubble Menu 示例</h2>
      <p>请尝试用鼠标<strong>选中</strong>这部分文字，或者<em>这段斜体的文字</em>，甚至是<del>带有删除线的</del>。</p>
      <p>你会发现一个上下文菜单会跟随着你的选区出现，让你快速进行格式化。</p>
    `,
  });

  if (!editor) {
    return null;
  }

  return (
    <>
      <BubbleMenu
        editor={editor}
        pluginKey="bubbleMenu"
        shouldShow={({ state, from, to }) => {
          const text = state.doc.textBetween(from, to, ' ');
          return from !== to && text.trim().length > 0;
        }}
        options={{ placement: 'top' }}
        updateDelay={250}
        className="bubble-menu-container" // 你也可以直接在这里加 class
      >
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'is-active' : ''}
        >
          Bold
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'is-active' : ''}
        >
          Italic
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? 'is-active' : ''}
        >
          Strike
        </button>
      </BubbleMenu>

      <EditorContent editor={editor} />
    </>
  );
};

export default TiptapWithBubbleMenu;
```

现在，你已经拥有了一个基于最新 Tiptap 规范、功能强大且完全可定制的 `BubbleMenu`！