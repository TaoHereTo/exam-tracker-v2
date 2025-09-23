"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Plus, Search, Trash2, Edit, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TextExtraction {
    id: string;
    title: string;
    content: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}

export default function TextExtractionView() {
    const [extractions, setExtractions] = useState<TextExtraction[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTag, setSelectedTag] = useState<string>("");

    // 新增/编辑表单状态
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        tags: [] as string[],
    });
    const [newTag, setNewTag] = useState("");

    // 获取所有标签
    const allTags = Array.from(new Set(extractions.flatMap(ext => ext.tags)));

    // 过滤提取内容
    const filteredExtractions = extractions.filter(ext => {
        const matchesSearch = ext.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ext.content.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTag = !selectedTag || ext.tags.includes(selectedTag);
        return matchesSearch && matchesTag;
    });

    const handleAdd = () => {
        setIsAdding(true);
        setFormData({ title: "", content: "", tags: [] });
    };

    const handleEdit = (extraction: TextExtraction) => {
        setEditingId(extraction.id);
        setFormData({
            title: extraction.title,
            content: extraction.content,
            tags: [...extraction.tags],
        });
    };

    const handleSave = () => {
        if (!formData.title.trim() || !formData.content.trim()) return;

        const now = new Date();

        if (editingId) {
            // 编辑现有记录
            setExtractions(prev => prev.map(ext =>
                ext.id === editingId
                    ? { ...ext, ...formData, updatedAt: now }
                    : ext
            ));
            setEditingId(null);
        } else {
            // 添加新记录
            const newExtraction: TextExtraction = {
                id: Date.now().toString(),
                ...formData,
                createdAt: now,
                updatedAt: now,
            };
            setExtractions(prev => [newExtraction, ...prev]);
            setIsAdding(false);
        }

        setFormData({ title: "", content: "", tags: [] });
    };

    const handleCancel = () => {
        setIsAdding(false);
        setEditingId(null);
        setFormData({ title: "", content: "", tags: [] });
    };

    const handleDelete = (id: string) => {
        setExtractions(prev => prev.filter(ext => ext.id !== id));
    };

    const addTag = () => {
        if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, newTag.trim()]
            }));
            setNewTag("");
        }
    };

    const removeTag = (tagToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    return (
        <div className="space-y-6">
            {/* 页面标题 */}
            <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                    <h1 className="text-3xl font-bold">文本摘录</h1>
                    <p className="text-muted-foreground">管理和整理申论相关的文本摘录</p>
                </div>
            </div>

            {/* 操作栏 */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-2 flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="搜索标题或内容..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-full sm:w-64"
                        />
                    </div>
                    <select
                        value={selectedTag}
                        onChange={(e) => setSelectedTag(e.target.value)}
                        className="px-3 py-2 border rounded-md bg-background"
                    >
                        <option value="">所有标签</option>
                        {allTags.map(tag => (
                            <option key={tag} value={tag}>{tag}</option>
                        ))}
                    </select>
                </div>
                <Button onClick={handleAdd} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    新增摘录
                </Button>
            </div>

            {/* 新增/编辑表单 */}
            {(isAdding || editingId) && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {editingId ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                            {editingId ? "编辑摘录" : "新增摘录"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="title">标题</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="请输入摘录标题..."
                            />
                        </div>

                        <div>
                            <Label htmlFor="content">内容</Label>
                            <Textarea
                                id="content"
                                value={formData.content}
                                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                                placeholder="请输入摘录内容..."
                                rows={6}
                            />
                        </div>

                        <div>
                            <Label>标签</Label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {formData.tags.map(tag => (
                                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                                        {tag}
                                        <button
                                            onClick={() => removeTag(tag)}
                                            className="ml-1 hover:text-destructive"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    placeholder="添加标签..."
                                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                                />
                                <Button onClick={addTag} variant="outline" size="sm">
                                    添加
                                </Button>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button onClick={handleSave} className="flex items-center gap-2">
                                <Save className="h-4 w-4" />
                                保存
                            </Button>
                            <Button onClick={handleCancel} variant="outline" className="flex items-center gap-2">
                                <X className="h-4 w-4" />
                                取消
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 摘录列表 */}
            <div className="space-y-4">
                {filteredExtractions.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">暂无摘录</h3>
                            <p className="text-muted-foreground text-center mb-4">
                                {searchTerm || selectedTag ? "没有找到匹配的摘录" : "开始添加您的第一个文本摘录"}
                            </p>
                            {!searchTerm && !selectedTag && (
                                <Button onClick={handleAdd} className="flex items-center gap-2">
                                    <Plus className="h-4 w-4" />
                                    新增摘录
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    filteredExtractions.map((extraction) => (
                        <Card key={extraction.id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-lg mb-2">{extraction.title}</CardTitle>
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            {extraction.tags.map(tag => (
                                                <Badge key={tag} variant="outline" className="text-xs">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                        <CardDescription>
                                            创建于 {extraction.createdAt.toLocaleDateString()}
                                            {extraction.updatedAt.getTime() !== extraction.createdAt.getTime() && (
                                                <span> • 更新于 {extraction.updatedAt.toLocaleDateString()}</span>
                                            )}
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            onClick={() => handleEdit(extraction)}
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            onClick={() => handleDelete(extraction.id)}
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="max-h-32 overflow-y-auto">
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                        {extraction.content}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
