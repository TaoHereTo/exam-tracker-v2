"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    FileText,
    Plus,
    Search,
    Edit3,
    Trash2,
    Save,
    Calendar,
    Tag,
    BookOpen,
    FileUp,
    FileDown,
    X
} from "lucide-react";
import { KnowledgeRichTextEditor } from "@/components/rich-text-editors/KnowledgeRichTextEditor";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/animate-ui/components/animate/tooltip";

// 笔记数据类型
interface Note {
    id: string;
    title: string;
    content: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
    isFavorite?: boolean;
}

export default function NotesViewNew() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTag, setSelectedTag] = useState<string>("");
    const [isCreating, setIsCreating] = useState(false);
    const [newNoteTitle, setNewNoteTitle] = useState("");
    const [newNoteContent, setNewNoteContent] = useState("");
    const [newNoteTags, setNewNoteTags] = useState("");
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { notify } = useNotification();
    const { user } = useAuth();

    // 获取所有标签
    const allTags = Array.from(new Set(notes.flatMap(note => note.tags)));

    // 过滤笔记
    const filteredNotes = notes.filter(note => {
        const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            note.content.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTag = !selectedTag || note.tags.includes(selectedTag);
        return matchesSearch && matchesTag;
    });

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
                tags: cloudNote.tags,
                createdAt: cloudNote.created_at,
                updatedAt: cloudNote.updated_at,
                isFavorite: cloudNote.is_favorite
            }));

            setNotes(localNotes);
        } catch (error) {
            console.error('加载笔记失败:', error);
            notify({
                type: "error",
                message: "加载笔记失败",
                description: "请检查网络连接或稍后重试"
            });
        } finally {
            setIsLoading(false);
        }
    };

    // 组件挂载时加载数据
    useEffect(() => {
        loadNotes();
    }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

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

        try {
            setIsSaving(true);

            const cloudNote = await notesService.createNote({
                title: newNoteTitle,
                content: newNoteContent,
                tags: newNoteTags.split(',').map(tag => tag.trim()).filter(tag => tag),
                is_favorite: false,
                is_archived: false
            });

            // 转换云笔记格式到本地格式
            const newNote: Note = {
                id: cloudNote.id,
                title: cloudNote.title,
                content: cloudNote.content,
                tags: cloudNote.tags,
                createdAt: cloudNote.created_at,
                updatedAt: cloudNote.updated_at,
                isFavorite: cloudNote.is_favorite
            };

            setNotes(prev => [newNote, ...prev]);
            setSelectedNote(newNote);
            setIsCreating(false);
            setNewNoteTitle("");
            setNewNoteContent("");
            setNewNoteTags("");

            notify({
                type: "success",
                message: "笔记创建成功"
            });
        } catch (error) {
            console.error('创建笔记失败:', error);
            notify({
                type: "error",
                message: "创建笔记失败",
                description: "请检查网络连接或稍后重试"
            });
        } finally {
            setIsSaving(false);
        }
    };

    // 保存笔记
    const handleSaveNote = async () => {
        if (!selectedNote || !user) return;

        try {
            setIsSaving(true);

            const cloudNote = await notesService.updateNote(selectedNote.id, {
                title: selectedNote.title,
                content: selectedNote.content,
                tags: selectedNote.tags,
                is_favorite: selectedNote.isFavorite || false,
                is_archived: false
            });

            // 转换云笔记格式到本地格式
            const updatedNote: Note = {
                id: cloudNote.id,
                title: cloudNote.title,
                content: cloudNote.content,
                tags: cloudNote.tags,
                createdAt: cloudNote.created_at,
                updatedAt: cloudNote.updated_at,
                isFavorite: cloudNote.is_favorite
            };

            setNotes(prev => prev.map(note =>
                note.id === selectedNote.id ? updatedNote : note
            ));
            setSelectedNote(updatedNote);
            setIsEditing(false);

            notify({
                type: "success",
                message: "笔记保存成功"
            });
        } catch (error) {
            console.error('保存笔记失败:', error);
            notify({
                type: "error",
                message: "保存笔记失败",
                description: "请检查网络连接或稍后重试"
            });
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

        try {
            await notesService.deleteNote(noteToDelete.id);

            setNotes(prev => prev.filter(note => note.id !== noteToDelete.id));
            if (selectedNote?.id === noteToDelete.id) {
                setSelectedNote(null);
            }
            setShowDeleteDialog(false);
            setNoteToDelete(null);

            notify({
                type: "success",
                message: "笔记删除成功"
            });
        } catch (error) {
            console.error('删除笔记失败:', error);
            notify({
                type: "error",
                message: "删除笔记失败",
                description: "请检查网络连接或稍后重试"
            });
        }
    };

    // 导出笔记
    const handleExportNote = (note: Note) => {
        const dataStr = JSON.stringify(note, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${note.title}.json`;
        link.click();
        URL.revokeObjectURL(url);

        notify({
            type: "success",
            message: "笔记导出成功"
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
                tags: note.tags,
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
                <div className="text-center text-muted-foreground">
                    <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50 animate-pulse" />
                    <h3 className="text-lg font-medium mb-2">加载中...</h3>
                    <p>正在加载你的笔记</p>
                </div>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className="h-full flex flex-col space-y-4">
                {/* 页面标题和操作栏 */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <BookOpen className="h-8 w-8 text-blue-600" />
                        <div>
                            <h1 className="text-3xl font-bold">笔记管理</h1>
                            <p className="text-muted-foreground">记录和管理你的学习笔记</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-10 w-10 rounded-full"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <FileUp className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>导入笔记</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-10 w-10 rounded-full"
                                    onClick={handleExportAllNotes}
                                >
                                    <FileDown className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>导出全部笔记</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="icon"
                                    className="h-10 w-10 rounded-full bg-blue-600 hover:bg-blue-700"
                                    onClick={() => setIsCreating(true)}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>新建笔记</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>

                <div className="flex-1 flex gap-4 min-h-0">
                    {/* 左侧笔记列表 - 使用简洁的边框样式 */}
                    <div className="w-80 flex flex-col border rounded-lg bg-card">
                        <div className="p-4 border-b">
                            <h2 className="text-lg font-semibold mb-3">笔记列表</h2>

                            {/* 搜索框 */}
                            <div className="relative mb-3">
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
                        </div>

                        <div className="flex-1 p-4">
                            <ScrollArea className="h-full">
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
                                                className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${selectedNote?.id === note.id ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950' : ''
                                                    }`}
                                                onClick={() => {
                                                    setSelectedNote(note);
                                                    setIsEditing(false);
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
                                                                {note.tags.map(tag => (
                                                                    <Badge key={tag} variant="secondary" className="text-xs">
                                                                        {tag}
                                                                    </Badge>
                                                                ))}
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
                                                                    <FileDown className="h-3 w-3" />
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
                    </div>

                    {/* 右侧笔记编辑区 */}
                    <div className="flex-1 flex flex-col border rounded-lg bg-card">
                        {selectedNote ? (
                            <>
                                <div className="p-4 border-b">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            {isEditing ? (
                                                <Input
                                                    value={selectedNote.title}
                                                    onChange={(e) => setSelectedNote({
                                                        ...selectedNote,
                                                        title: e.target.value
                                                    })}
                                                    className="text-lg font-semibold"
                                                />
                                            ) : (
                                                <h2 className="text-lg font-semibold">{selectedNote.title}</h2>
                                            )}
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {formatDate(selectedNote.updatedAt)}
                                                </div>
                                                {selectedNote.tags.length > 0 && (
                                                    <div className="flex items-center gap-1">
                                                        <Tag className="h-3 w-3" />
                                                        {selectedNote.tags.join(', ')}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isEditing ? (
                                                <>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="h-8 w-8 rounded-full"
                                                                onClick={() => setIsEditing(false)}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>取消编辑</p>
                                                        </TooltipContent>
                                                    </Tooltip>

                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                size="icon"
                                                                className="h-8 w-8 rounded-full bg-green-600 hover:bg-green-700"
                                                                onClick={handleSaveNote}
                                                                disabled={isSaving}
                                                            >
                                                                <Save className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{isSaving ? "保存中..." : "保存笔记"}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </>
                                            ) : (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            size="icon"
                                                            className="h-8 w-8 rounded-full"
                                                            onClick={() => setIsEditing(true)}
                                                        >
                                                            <Edit3 className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>编辑笔记</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 p-4">
                                    {isEditing ? (
                                        <KnowledgeRichTextEditor
                                            value={selectedNote.content}
                                            onChange={(content) => setSelectedNote({
                                                ...selectedNote,
                                                content
                                            })}
                                            placeholder="开始编写你的笔记..."
                                            className="h-full"
                                        />
                                    ) : (
                                        <div
                                            className="prose prose-sm max-w-none h-full overflow-auto"
                                            dangerouslySetInnerHTML={{ __html: selectedNote.content }}
                                        />
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center text-muted-foreground">
                                    <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                    <h3 className="text-lg font-medium mb-2">选择一个笔记</h3>
                                    <p>从左侧列表中选择一个笔记开始编辑，或创建新笔记</p>
                                </div>
                            </div>
                        )}
                    </div>
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

                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="note-title">标题</Label>
                                <Input
                                    id="note-title"
                                    value={newNoteTitle}
                                    onChange={(e) => setNewNoteTitle(e.target.value)}
                                    placeholder="输入笔记标题..."
                                />
                            </div>

                            <div>
                                <Label htmlFor="note-tags">标签</Label>
                                <Input
                                    id="note-tags"
                                    value={newNoteTags}
                                    onChange={(e) => setNewNoteTags(e.target.value)}
                                    placeholder="输入标签，用逗号分隔..."
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreating(false)}>
                                取消
                            </Button>
                            <Button onClick={handleCreateNote} disabled={isSaving}>
                                {isSaving ? "创建中..." : "创建笔记"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* 删除确认对话框 */}
                <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>确认删除</DialogTitle>
                            <DialogDescription>
                                确定要删除笔记 "{noteToDelete?.title}" 吗？此操作无法撤销。
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                                取消
                            </Button>
                            <Button variant="destructive" onClick={confirmDeleteNote}>
                                删除
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
