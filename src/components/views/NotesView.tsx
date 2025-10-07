"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CircularButton } from "@/components/ui/circular-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/animate-ui/components/animate/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/animate-ui/components/radix/hover-card";
import {
    FileText,
    Plus,
    Search,
    Trash2,
    Save,
    Calendar,
    Tag,
    BookOpen,
    FileUp,
    FileDown,
    List,
    ChevronDown,
    Edit3,
    X,
    Palette
} from "lucide-react";
import SimpleRichTextEditor from "@/components/rich-text-editors/SimpleRichTextEditor";
import { UiverseSpinner } from "@/components/ui/UiverseSpinner";
import { MixedText } from "@/components/ui/MixedText";
import { useNotification } from "@/components/magicui/NotificationProvider";
import { notesService, type Note as CloudNote } from "@/lib/notesService";
import { useAuth } from "@/contexts/AuthContext";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-with-animation";
// 标签数据类型
interface NoteTag {
    name: string;
    color: string;
}

// 笔记数据类型
interface Note {
    id: string;
    title: string;
    content: string;
    tags: NoteTag[];
    createdAt: string;
    updatedAt: string;
    isFavorite?: boolean;
}

export default function NotesView() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTag, setSelectedTag] = useState<string>("");
    const [isCreating, setIsCreating] = useState(false);
    const [newNoteTitle, setNewNoteTitle] = useState("");
    const [newNoteContent, setNewNoteContent] = useState("");
    const [newNoteTags, setNewNoteTags] = useState<NoteTag[]>([]);
    const [newTagName, setNewTagName] = useState("");
    const [newTagColor, setNewTagColor] = useState("#3b82f6");
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
    const [showTagEditDialog, setShowTagEditDialog] = useState(false);
    const [isHoverCardOpen, setIsHoverCardOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const colorPickerRef = useRef<HTMLDivElement>(null);
    const { notify, notifyLoading, updateToSuccess, updateToError } = useNotification();
    const { user } = useAuth();

    // 预定义的颜色选项
    const tagColors = [
        "#3b82f6", // 蓝色
        "#ef4444", // 红色
        "#10b981", // 绿色
        "#f59e0b", // 黄色
        "#8b5cf6", // 紫色
        "#06b6d4", // 青色
        "#f97316", // 橙色
        "#84cc16", // 青绿色
        "#ec4899", // 粉色
        "#6b7280", // 灰色
    ];

    // 获取所有标签 - 修复版本
    const allTags = Array.from(new Set(
        notes.flatMap(note =>
            note.tags.map(tag => {
                // 处理嵌套对象的情况
                if (typeof tag === 'string') {
                    return tag;
                } else if (typeof tag === 'object' && tag !== null) {
                    // 处理嵌套对象的情况
                    const tagObj = tag as unknown as Record<string, unknown>;
                    // 如果tag.name也是对象，继续提取
                    if (typeof tagObj.name === 'string') {
                        return tagObj.name;
                    } else if (typeof tagObj.name === 'object' && tagObj.name !== null) {
                        // 如果tag.name.name存在，使用它
                        const nameObj = tagObj.name as Record<string, unknown>;
                        return String(nameObj.name || tagObj.name);
                    } else {
                        return String(tagObj.name || tag);
                    }
                } else {
                    return String(tag);
                }
            })
        )
    ));

    // 过滤笔记
    const filteredNotes = notes.filter(note => {
        const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            note.content.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTag = !selectedTag || note.tags.some(tag => tag.name === selectedTag);
        return matchesSearch && matchesTag;
    });

    // 添加标签
    const addTag = () => {
        if (newTagName.trim() && !newNoteTags.some(tag => tag.name === newTagName.trim())) {
            setNewNoteTags([...newNoteTags, { name: newTagName.trim(), color: newTagColor }]);
            setNewTagName("");
        }
    };

    // 添加标签到选中的笔记
    const addTagToSelectedNote = () => {
        if (!newTagName.trim() || !selectedNote) return;

        // 检查标签是否已存在
        const tagExists = selectedNote.tags.some(tag => {
            const tagName = typeof tag === 'string' ? tag : (
                typeof tag.name === 'string' ? tag.name : String(tag.name || tag)
            );
            return tagName === newTagName.trim();
        });

        if (tagExists) return;

        const newTag: NoteTag = {
            name: newTagName.trim(),
            color: newTagColor
        };

        setSelectedNote({
            ...selectedNote,
            tags: [...selectedNote.tags, newTag]
        });
        setNewTagName("");
        setNewTagColor("#3b82f6"); // 重置为默认颜色
    };

    // 关闭标签管理弹窗
    const closeTagManager = () => {
        setIsHoverCardOpen(false);
        setShowColorPicker(false);
    };

    // 删除标签
    const removeTag = (tagName: string) => {
        setNewNoteTags(newNoteTags.filter(tag => tag.name !== tagName));
    };

    // 加载笔记数据
    const loadNotes = async () => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const cloudNotes = await notesService.getNotes();

            // 转换云笔记格式到本地格式
            const localNotes: Note[] = cloudNotes.map(cloudNote => ({
                id: cloudNote.id,
                title: cloudNote.title,
                content: cloudNote.content,
                tags: Array.isArray(cloudNote.tags)
                    ? cloudNote.tags.map((tag: string) => ({ name: tag, color: "#3b82f6" })) // 默认蓝色
                    : [],
                createdAt: cloudNote.created_at,
                updatedAt: cloudNote.updated_at,
                isFavorite: cloudNote.is_favorite
            }));

            setNotes(localNotes);
        } catch (error) {
            console.error('加载笔记失败:', error);
            // 对于数据库未初始化的情况，不显示错误通知，只记录日志
            if (error instanceof Error && (
                error.message.includes('relation') ||
                error.message.includes('does not exist') ||
                error.message.includes('permission')
            )) {
                console.log('数据库未初始化，显示空状态');
                setNotes([]);
            } else {
                notify({
                    type: "error",
                    message: "加载笔记失败",
                    description: "请检查网络连接或稍后重试"
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    // 组件挂载时加载数据（只在用户变化时重新加载）
    useEffect(() => {
        if (user && notes.length === 0) {
            loadNotes();
        }
    }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

    // 点击外部关闭颜色选择器
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
                setShowColorPicker(false);
            }
        };

        if (showColorPicker) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showColorPicker]);

    // 创建新笔记
    const handleCreateNote = async () => {
        if (!newNoteTitle.trim()) {
            notify({
                type: "error",
                message: "请输入笔记标题"
            });
            return;
        }

        if (!user) {
            notify({
                type: "error",
                message: "请先登录"
            });
            return;
        }

        // 显示loading toast
        const toastId = notifyLoading?.('正在创建笔记...', '请稍候');

        try {
            setIsSaving(true);

            const cloudNote = await notesService.createNote({
                title: newNoteTitle,
                content: newNoteContent,
                tags: newNoteTags.map(tag => tag.name),
                is_favorite: false,
                is_archived: false
            });

            // 转换云笔记格式到本地格式
            const newNote: Note = {
                id: cloudNote.id,
                title: cloudNote.title,
                content: cloudNote.content,
                tags: newNoteTags, // 使用带颜色的标签
                createdAt: cloudNote.created_at,
                updatedAt: cloudNote.updated_at,
                isFavorite: cloudNote.is_favorite
            };

            setNotes(prev => [newNote, ...prev]);
            setSelectedNote(newNote);
            setIsCreating(false);
            setNewNoteTitle("");
            setNewNoteContent("");
            setNewNoteTags([]);
            setNewTagName("");
            setNewTagColor("#3b82f6");

            // 更新为成功状态
            if (toastId && updateToSuccess) {
                updateToSuccess(toastId, '笔记创建成功', '新笔记已创建并保存到云端');
            } else {
                notify({
                    type: "success",
                    message: "笔记创建成功"
                });
            }
        } catch (error) {
            console.error('创建笔记失败:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);

            // 更新为错误状态
            if (toastId && updateToError) {
                updateToError(toastId, '创建失败', `创建笔记时出错: ${errorMessage}`);
            } else {
                notify({
                    type: "error",
                    message: "创建笔记失败",
                    description: "请检查网络连接或稍后重试"
                });
            }
        } finally {
            setIsSaving(false);
        }
    };

    // 保存笔记
    const handleSaveNote = async () => {
        if (!selectedNote || !user) return;

        // 显示loading toast
        const toastId = notifyLoading?.('正在保存笔记...', '请稍候');

        try {
            setIsSaving(true);

            const cloudNote = await notesService.updateNote(selectedNote.id, {
                title: selectedNote.title,
                content: selectedNote.content,
                tags: selectedNote.tags.map(tag => tag.name),
                is_favorite: selectedNote.isFavorite || false,
                is_archived: false
            });

            // 转换云笔记格式到本地格式
            const updatedNote: Note = {
                id: cloudNote.id,
                title: cloudNote.title,
                content: cloudNote.content,
                tags: Array.isArray(cloudNote.tags)
                    ? cloudNote.tags.map((tag: string) => ({ name: tag, color: "#3b82f6" })) // 默认蓝色
                    : [],
                createdAt: cloudNote.created_at,
                updatedAt: cloudNote.updated_at,
                isFavorite: cloudNote.is_favorite
            };

            setNotes(prev => prev.map(note =>
                note.id === selectedNote.id ? updatedNote : note
            ));
            setSelectedNote(updatedNote);

            // 更新为成功状态
            if (toastId && updateToSuccess) {
                updateToSuccess(toastId, '笔记保存成功', '笔记已成功保存到云端');
            } else {
                notify({
                    type: "success",
                    message: "笔记保存成功"
                });
            }
        } catch (error) {
            console.error('保存笔记失败:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);

            // 更新为错误状态
            if (toastId && updateToError) {
                updateToError(toastId, '保存失败', `保存笔记时出错: ${errorMessage}`);
            } else {
                notify({
                    type: "error",
                    message: "保存笔记失败",
                    description: "请检查网络连接或稍后重试"
                });
            }
        } finally {
            setIsSaving(false);
        }
    };

    // 删除笔记
    const handleDeleteNote = (note: Note) => {
        setNoteToDelete(note);
        setShowDeleteDialog(true);
    };

    const confirmDeleteNote = async () => {
        if (!noteToDelete || !user) return;

        // 先更新本地数据
        setNotes(prev => prev.filter(note => note.id !== noteToDelete.id));
        if (selectedNote?.id === noteToDelete.id) {
            setSelectedNote(null);
        }
        setShowDeleteDialog(false);
        setNoteToDelete(null);

        // 显示删除的加载通知
        let toastId: string | undefined;
        if (notifyLoading) {
            toastId = notifyLoading('正在删除笔记', `正在删除: ${noteToDelete.title}`);
        } else {
            notify({
                type: 'info',
                message: '正在删除笔记',
                description: `正在删除: ${noteToDelete.title}`
            });
        }

        try {
            await notesService.deleteNote(noteToDelete.id);

            // 更新为成功状态
            if (toastId && updateToSuccess) {
                updateToSuccess(toastId, '笔记删除成功', `"${noteToDelete.title}"已从云端删除`);
            } else {
                notify({
                    type: "success",
                    message: "笔记删除成功"
                });
            }
        } catch (error) {
            console.error('删除笔记失败:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);

            // 更新为错误状态
            if (toastId && updateToError) {
                updateToError(toastId, '云端删除失败', `笔记已从本地删除，但云端同步失败: ${errorMessage}`);
            } else {
                notify({
                    type: "error",
                    message: "删除笔记失败",
                    description: "请检查网络连接或稍后重试"
                });
            }
        }
    };

    // 导出笔记（支持多种格式）
    const handleExportNote = (note: Note, format: 'json' | 'txt' | 'md' | 'pdf' = 'json') => {
        let content = '';
        let mimeType = '';
        let fileExtension = '';

        switch (format) {
            case 'json':
                content = JSON.stringify(note, null, 2);
                mimeType = 'application/json';
                fileExtension = 'json';
                break;
            case 'txt':
                content = `标题: ${note.title}\n\n创建时间: ${note.createdAt}\n更新时间: ${note.updatedAt}\n\n标签: ${note.tags.map(tag => tag.name).join(', ')}\n\n内容:\n${note.content.replace(/<[^>]*>/g, '')}`;
                mimeType = 'text/plain';
                fileExtension = 'txt';
                break;
            case 'md':
                content = `# ${note.title}\n\n**创建时间:** ${note.createdAt}\n**更新时间:** ${note.updatedAt}\n\n**标签:** ${note.tags.map(tag => `#${tag.name}`).join(' ')}\n\n---\n\n${note.content.replace(/<[^>]*>/g, '')}`;
                mimeType = 'text/markdown';
                fileExtension = 'md';
                break;
            case 'pdf':
                // 对于PDF，我们创建一个简单的HTML内容，然后让浏览器处理
                const htmlContent = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <title>${note.title}</title>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 40px; }
                            h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
                            .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
                            .content { line-height: 1.6; }
                        </style>
                    </head>
                    <body>
                        <h1>${note.title}</h1>
                        <div class="meta">
                            <p><strong>创建时间:</strong> ${note.createdAt}</p>
                            <p><strong>更新时间:</strong> ${note.updatedAt}</p>
                            <p><strong>标签:</strong> ${note.tags.map(tag => tag.name).join(', ')}</p>
                        </div>
                        <div class="content">
                            ${note.content.replace(/<[^>]*>/g, '')}
                        </div>
                    </body>
                    </html>
                `;
                content = htmlContent;
                mimeType = 'text/html';
                fileExtension = 'html';
                break;
        }

        const dataBlob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${note.title}.${fileExtension}`;
        link.click();
        URL.revokeObjectURL(url);

        notify({
            type: "success",
            message: `笔记导出成功 (${format.toUpperCase()})`
        });
    };

    // 导出所有笔记
    const handleExportAllNotes = async () => {
        try {
            // 转换本地笔记格式到云格式
            const cloudNotes: CloudNote[] = notes.map(note => ({
                id: note.id,
                user_id: user?.id || '',
                title: note.title,
                content: note.content,
                tags: note.tags.map(tag => tag.name),
                is_favorite: note.isFavorite || false,
                is_archived: false,
                created_at: note.createdAt,
                updated_at: note.updatedAt
            }));

            const exportData = await notesService.exportNotes(cloudNotes);
            const dataBlob = new Blob([exportData], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `notes-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);

            notify({
                type: "success",
                message: "所有笔记导出成功"
            });
        } catch (error) {
            console.error('导出笔记失败:', error);
            notify({
                type: "error",
                message: "导出笔记失败",
                description: "请稍后重试"
            });
        }
    };

    // 导入笔记
    const handleImportNotes = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const jsonData = e.target?.result as string;
                const result = await notesService.importNotes(jsonData);

                // 重新加载笔记列表
                await loadNotes();

                notify({
                    type: "success",
                    message: `成功导入 ${result.success} 个笔记`,
                    description: result.failed > 0 ? `${result.failed} 个笔记导入失败` : undefined
                });
            } catch (error) {
                console.error('导入笔记失败:', error);
                notify({
                    type: "error",
                    message: "导入失败",
                    description: error instanceof Error ? error.message : "请确保文件格式正确"
                });
            }
        };
        reader.readAsText(file);
    };

    // 格式化日期
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // 如果用户未登录，显示登录提示
    if (!user) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                    <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">请先登录</h3>
                    <p>登录后即可使用笔记管理功能</p>
                </div>
            </div>
        );
    }

    // 如果正在加载，显示加载状态
    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center text-center text-muted-foreground">
                    <UiverseSpinner size="lg" className="mb-4" />
                    <h3 className="text-lg font-medium mb-2">加载中...</h3>
                    <p>正在加载你的笔记</p>
                </div>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className="h-full flex flex-col p-4">
                {/* 顶部操作栏 */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <List className="h-4 w-4 mr-1" />
                                    笔记列表
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-80">
                                <SheetHeader>
                                    <SheetTitle>笔记列表</SheetTitle>
                                </SheetHeader>
                                <div className="mt-4 px-4 space-y-4">
                                    {/* 搜索框 */}
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="搜索笔记..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>

                                    {/* 标签过滤 */}
                                    {allTags.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            <Badge
                                                variant={selectedTag === "" ? "default" : "outline"}
                                                className="cursor-pointer"
                                                onClick={() => setSelectedTag("")}
                                            >
                                                全部
                                            </Badge>
                                            {allTags.map(tag => (
                                                <Badge
                                                    key={tag}
                                                    variant={selectedTag === tag ? "default" : "outline"}
                                                    className="cursor-pointer"
                                                    onClick={() => setSelectedTag(tag)}
                                                >
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}

                                    {/* 新建笔记按钮 */}
                                    <Button
                                        onClick={() => setIsCreating(true)}
                                        className="w-full h-9 px-6 rounded-full font-medium bg-[#ea580c] hover:bg-[#ea580c]/90 text-white"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Plus className="w-5 h-5" />
                                            <MixedText text="新建笔记" />
                                        </div>
                                    </Button>
                                </div>

                                {/* 笔记列表 */}
                                <div className="mt-4 flex-1 overflow-hidden px-4">
                                    <ScrollArea className="h-[calc(100vh-200px)]">
                                        <div className="space-y-2">
                                            {filteredNotes.length === 0 ? (
                                                <div className="text-center text-muted-foreground py-8">
                                                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                                    <p>没有找到笔记</p>
                                                </div>
                                            ) : (
                                                filteredNotes.map(note => (
                                                    <div
                                                        key={note.id}
                                                        className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${selectedNote?.id === note.id
                                                            ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 shadow-sm'
                                                            : 'hover:border-muted-foreground/20'
                                                            }`}
                                                        onClick={() => {
                                                            setSelectedNote(note);
                                                        }}
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="font-medium truncate">{note.title}</h3>
                                                                <p className="text-sm text-muted-foreground mt-1">
                                                                    {formatDate(note.updatedAt)}
                                                                </p>
                                                                {note.tags.length > 0 && (
                                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                                        {note.tags.map((tag, index) => {
                                                                            // 确保提取的是字符串
                                                                            const tagName = typeof tag === 'string' ? tag : (
                                                                                typeof tag.name === 'string' ? tag.name : String(tag.name || tag)
                                                                            );
                                                                            const tagColor = typeof tag === 'object' && tag.color ? tag.color : '#3b82f6';

                                                                            return (
                                                                                <Badge
                                                                                    key={index}
                                                                                    className="text-xs text-white"
                                                                                    style={{ backgroundColor: tagColor }}
                                                                                >
                                                                                    {tagName}
                                                                                </Badge>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1 ml-2">
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-6 w-6 rounded-full"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleExportNote(note);
                                                                            }}
                                                                        >
                                                                            <FileUp className="h-3 w-3" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>导出笔记</p>
                                                                    </TooltipContent>
                                                                </Tooltip>

                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-6 w-6 rounded-full text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleDeleteNote(note);
                                                                            }}
                                                                        >
                                                                            <Trash2 className="h-3 w-3" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>删除笔记</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    {/* 右侧操作按钮 */}
                    <div className="flex items-center gap-2">
                        {selectedNote && (
                            <>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <CircularButton
                                            variant="success"
                                            size="default"
                                            onClick={handleSaveNote}
                                            disabled={isSaving}
                                        >
                                            <Save className="h-4 w-4" />
                                        </CircularButton>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{isSaving ? "保存中..." : "保存笔记"}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </>
                        )}

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-full"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <FileDown className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>导入笔记</p>
                            </TooltipContent>
                        </Tooltip>

                        {selectedNote && (
                            <DropdownMenu>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 rounded-full"
                                            >
                                                <FileUp className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>导出当前笔记</p>
                                    </TooltipContent>
                                </Tooltip>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleExportNote(selectedNote, 'json')}>
                                        <FileText className="h-4 w-4 mr-1" />
                                        导出为 JSON
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleExportNote(selectedNote, 'txt')}>
                                        <FileText className="h-4 w-4 mr-1" />
                                        导出为 TXT
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleExportNote(selectedNote, 'md')}>
                                        <FileText className="h-4 w-4 mr-1" />
                                        导出为 Markdown
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleExportNote(selectedNote, 'pdf')}>
                                        <FileText className="h-4 w-4 mr-1" />
                                        导出为 PDF
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        <Button
                            onClick={() => setIsCreating(true)}
                            className="h-9 px-6 rounded-full font-medium bg-[#ea580c] text-white hover:bg-[#ea580c]/90"
                        >
                            <div className="flex items-center gap-2">
                                <Plus className="w-5 h-5" />
                                <MixedText text="新建笔记" />
                            </div>
                        </Button>
                    </div>
                </div>

                {/* 主编辑区域 */}
                <div className="flex-1 min-h-0">
                    {selectedNote ? (
                        <>
                            <div className="mb-4">
                                <Input
                                    value={selectedNote.title}
                                    onChange={(e) => setSelectedNote({
                                        ...selectedNote,
                                        title: e.target.value
                                    })}
                                    className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 px-2 py-1"
                                    placeholder="输入笔记标题..."
                                />
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {formatDate(selectedNote.updatedAt)}
                                    </div>
                                    <Popover open={isHoverCardOpen} onOpenChange={setIsHoverCardOpen}>
                                        <PopoverTrigger asChild>
                                            <div className="flex items-center gap-1 cursor-pointer hover:bg-muted/50 rounded-md px-2 py-1 transition-colors group">
                                                <Tag className="h-3 w-3 group-hover:text-blue-600 transition-colors" />
                                                <span className="group-hover:text-blue-600 transition-colors">
                                                    {selectedNote.tags.length > 0 ? (
                                                        selectedNote.tags.map(tag => {
                                                            // 确保提取的是字符串
                                                            return typeof tag === 'string' ? tag : (
                                                                typeof tag.name === 'string' ? tag.name : String(tag.name || tag)
                                                            );
                                                        }).join(', ')
                                                    ) : (
                                                        '添加标签'
                                                    )}
                                                </span>
                                                <Edit3 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            className="w-80 p-4"
                                            align="start"
                                            side="bottom"
                                            sideOffset={5}
                                        >
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="text-sm font-medium">标签管理</div>
                                                    <button
                                                        type="button"
                                                        onClick={closeTagManager}
                                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>

                                                {/* 当前标签显示 */}
                                                <div className="space-y-2">
                                                    <div className="text-xs text-muted-foreground">
                                                        {selectedNote.tags.length > 0 ? '当前标签' : '暂无标签'}
                                                    </div>
                                                    {selectedNote.tags.length > 0 && (
                                                        <div className="flex flex-wrap gap-2">
                                                            {selectedNote.tags.map((tag, index) => {
                                                                const tagName = typeof tag === 'string' ? tag : (
                                                                    typeof tag.name === 'string' ? tag.name : String(tag.name || tag)
                                                                );
                                                                const tagColor = typeof tag === 'object' && tag.color ? tag.color : '#3b82f6';

                                                                return (
                                                                    <Badge
                                                                        key={index}
                                                                        className="flex items-center gap-1 px-2 py-1 text-xs"
                                                                        style={{ backgroundColor: tagColor, color: 'white' }}
                                                                    >
                                                                        {tagName}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const newTags = selectedNote.tags.filter((_, i) => i !== index);
                                                                                setSelectedNote({
                                                                                    ...selectedNote,
                                                                                    tags: newTags
                                                                                });
                                                                            }}
                                                                            className="ml-1 hover:bg-black/20 rounded-full p-0.5"
                                                                        >
                                                                            <X className="w-3 h-3" />
                                                                        </button>
                                                                    </Badge>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* 添加新标签 */}
                                                <div className="space-y-2">
                                                    <div className="text-xs text-muted-foreground">添加新标签</div>
                                                    <div className="flex gap-2">
                                                        <div className="relative flex-1">
                                                            <Input
                                                                value={newTagName}
                                                                onChange={(e) => setNewTagName(e.target.value)}
                                                                placeholder="输入标签名称"
                                                                onKeyPress={(e) => e.key === 'Enter' && addTagToSelectedNote()}
                                                                className="pr-12 h-8 text-sm"
                                                            />
                                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center" ref={colorPickerRef}>
                                                                <button
                                                                    type="button"
                                                                    className="h-5 w-5 rounded-full border border-gray-300 hover:scale-110 transition-transform cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                    style={{ backgroundColor: newTagColor }}
                                                                    title="选择颜色"
                                                                    onClick={() => {
                                                                        setShowColorPicker(!showColorPicker);
                                                                    }}
                                                                />
                                                                {showColorPicker && (
                                                                    <div className="absolute top-6 right-0 z-[var(--z-maximum)] w-48 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                                                                        <div className="space-y-2">
                                                                            <div className="text-xs font-medium">选择颜色</div>
                                                                            <div className="flex flex-wrap gap-2">
                                                                                {tagColors.map((color) => (
                                                                                    <div
                                                                                        key={color}
                                                                                        className={`w-6 h-6 rounded-full border border-gray-300 hover:scale-110 transition-transform cursor-pointer flex-shrink-0 ${newTagColor === color ? 'ring-2 ring-blue-500' : ''
                                                                                            }`}
                                                                                        style={{ backgroundColor: color }}
                                                                                        onClick={() => {
                                                                                            setNewTagColor(color);
                                                                                            setShowColorPicker(false);
                                                                                        }}
                                                                                        title={color}
                                                                                    />
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            onClick={addTagToSelectedNote}
                                                            disabled={!newTagName.trim()}
                                                            size="sm"
                                                            className="h-8 px-3 rounded-full text-white hover:opacity-90 transition-opacity text-xs"
                                                            style={{
                                                                backgroundColor: newTagColor,
                                                                borderColor: newTagColor
                                                            }}
                                                        >
                                                            添加
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>

                            <div className="flex-1 min-h-[500px]">
                                <SimpleRichTextEditor
                                    content={selectedNote.content}
                                    onChange={(content) => setSelectedNote({
                                        ...selectedNote,
                                        content
                                    })}
                                    placeholder="开始编写你的笔记..."
                                    className="h-full"
                                    customMinHeight="500px"
                                    customMaxHeight="800px"
                                />
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
                            <div className="text-center text-muted-foreground">
                                <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                <h3 className="text-lg font-medium mb-2">选择一个笔记</h3>
                                <p>从列表中选择一个笔记开始编辑，或创建新笔记</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* 创建笔记对话框 */}
                <Dialog open={isCreating} onOpenChange={setIsCreating}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>创建新笔记</DialogTitle>
                            <DialogDescription>
                                填写笔记的基本信息，创建后可以开始编辑内容
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="note-title">标题</Label>
                                <Input
                                    id="note-title"
                                    value={newNoteTitle}
                                    onChange={(e) => setNewNoteTitle(e.target.value)}
                                    placeholder="输入笔记标题..."
                                />
                            </div>

                            <div className="space-y-4">
                                <Label>标签</Label>

                                {/* 已添加的标签 */}
                                {newNoteTags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {newNoteTags.map((tag, index) => {
                                            // 确保提取的是字符串
                                            const tagName = typeof tag === 'string' ? tag : (
                                                typeof tag.name === 'string' ? tag.name : String(tag.name || tag)
                                            );
                                            const tagColor = typeof tag === 'object' && tag.color ? tag.color : '#3b82f6';

                                            return (
                                                <Badge
                                                    key={index}
                                                    className="flex items-center gap-1 px-2 py-1 text-xs"
                                                    style={{ backgroundColor: tagColor, color: 'white' }}
                                                >
                                                    {tagName}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeTag(tagName)}
                                                        className="ml-1 hover:bg-black/20 rounded-full p-0.5"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* 添加新标签 */}
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Input
                                            value={newTagName}
                                            onChange={(e) => setNewTagName(e.target.value)}
                                            placeholder="输入标签名称"
                                            onKeyPress={(e) => e.key === 'Enter' && addTag()}
                                            className="pr-12"
                                        />
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center" ref={colorPickerRef}>
                                            <button
                                                type="button"
                                                className="h-6 w-6 rounded-full border border-gray-300 hover:scale-110 transition-transform cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                style={{ backgroundColor: newTagColor }}
                                                title="选择颜色"
                                                onClick={() => {
                                                    setShowColorPicker(!showColorPicker);
                                                    console.log('颜色选择器切换:', !showColorPicker);
                                                }}
                                            />
                                            {showColorPicker && (
                                                <div className="absolute top-8 right-0 z-[var(--z-modal)] w-48 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                                                    <div className="space-y-2">
                                                        <div className="text-sm font-medium">选择颜色</div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {tagColors.map((color) => (
                                                                <div
                                                                    key={color}
                                                                    className={`w-6 h-6 rounded-full border border-gray-300 hover:scale-110 transition-transform cursor-pointer flex-shrink-0 ${newTagColor === color ? 'ring-2 ring-blue-500' : ''
                                                                        }`}
                                                                    style={{ backgroundColor: color }}
                                                                    onClick={() => {
                                                                        setNewTagColor(color);
                                                                        setShowColorPicker(false);
                                                                        console.log('颜色选择:', color);
                                                                    }}
                                                                    title={color}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={addTag}
                                        disabled={!newTagName.trim()}
                                        size="sm"
                                        className="h-9 px-4 rounded-full text-white hover:opacity-90 transition-opacity"
                                        style={{
                                            backgroundColor: newTagColor,
                                            borderColor: newTagColor
                                        }}
                                    >
                                        添加
                                    </Button>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    输入标签名称，多个标签用逗号分隔
                                </p>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setIsCreating(false)}
                                className="h-9 px-6 rounded-full font-medium"
                            >
                                取消
                            </Button>
                            <Button
                                onClick={handleCreateNote}
                                disabled={isSaving}
                                className="h-9 px-6 rounded-full font-medium bg-[#ea580c] hover:bg-[#ea580c]/90 text-white"
                            >
                                {isSaving ? "创建中..." : "创建笔记"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* 删除确认对话框 */}
                <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle><MixedText text="确认删除" /></DialogTitle>
                            <DialogDescription>
                                <MixedText text={`确定要删除笔记 "${noteToDelete?.title}" 吗？`} />
                                <br />
                                <br />
                                <MixedText text="此操作不可撤销，删除后无法恢复。" />
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="flex items-center justify-center rounded-full">
                                <MixedText text="取消" />
                            </Button>
                            <Button variant="destructive" onClick={confirmDeleteNote} className="flex items-center justify-center rounded-full">
                                <MixedText text="确认删除" />
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* 标签编辑对话框 */}
                <Dialog open={showTagEditDialog} onOpenChange={setShowTagEditDialog}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>编辑标签</DialogTitle>
                            <DialogDescription>
                                管理笔记的标签，可以添加、删除或修改标签
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            {/* 当前标签显示 */}
                            {selectedNote && selectedNote.tags.length > 0 && (
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">当前标签</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedNote.tags.map((tag, index) => {
                                            const tagName = typeof tag === 'string' ? tag : (
                                                typeof tag.name === 'string' ? tag.name : String(tag.name || tag)
                                            );
                                            const tagColor = typeof tag === 'object' && tag.color ? tag.color : '#3b82f6';

                                            return (
                                                <Badge
                                                    key={index}
                                                    className="flex items-center gap-1 px-2 py-1 text-xs"
                                                    style={{ backgroundColor: tagColor, color: 'white' }}
                                                >
                                                    {tagName}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newTags = selectedNote.tags.filter((_, i) => i !== index);
                                                            setSelectedNote({
                                                                ...selectedNote,
                                                                tags: newTags
                                                            });
                                                        }}
                                                        className="ml-1 hover:bg-black/20 rounded-full p-0.5"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* 添加新标签 */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">添加新标签</Label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Input
                                            value={newTagName}
                                            onChange={(e) => setNewTagName(e.target.value)}
                                            placeholder="输入标签名称"
                                            onKeyPress={(e) => e.key === 'Enter' && addTagToSelectedNote()}
                                            className="pr-12"
                                        />
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center" ref={colorPickerRef}>
                                            <button
                                                type="button"
                                                className="h-6 w-6 rounded-full border border-gray-300 hover:scale-110 transition-transform cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                style={{ backgroundColor: newTagColor }}
                                                title="选择颜色"
                                                onClick={() => {
                                                    setShowColorPicker(!showColorPicker);
                                                }}
                                            />
                                            {showColorPicker && (
                                                <div className="absolute top-8 right-0 z-[var(--z-modal)] w-48 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                                                    <div className="space-y-2">
                                                        <div className="text-sm font-medium">选择颜色</div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {tagColors.map((color) => (
                                                                <div
                                                                    key={color}
                                                                    className={`w-6 h-6 rounded-full border border-gray-300 hover:scale-110 transition-transform cursor-pointer flex-shrink-0 ${newTagColor === color ? 'ring-2 ring-blue-500' : ''
                                                                        }`}
                                                                    style={{ backgroundColor: color }}
                                                                    onClick={() => {
                                                                        setNewTagColor(color);
                                                                        setShowColorPicker(false);
                                                                    }}
                                                                    title={color}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={addTagToSelectedNote}
                                        disabled={!newTagName.trim()}
                                        size="sm"
                                        className="h-9 px-4 rounded-full text-white hover:opacity-90 transition-opacity"
                                        style={{
                                            backgroundColor: newTagColor,
                                            borderColor: newTagColor
                                        }}
                                    >
                                        添加
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowTagEditDialog(false)} className="rounded-full">
                                完成
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* 隐藏的文件输入 */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImportNotes}
                    style={{ display: 'none' }}
                />
            </div>
        </TooltipProvider>
    );
}
