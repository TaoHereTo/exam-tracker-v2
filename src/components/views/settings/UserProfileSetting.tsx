import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNotification } from "@/components/magicui/NotificationProvider";
import { UserProfileService } from "@/lib/userProfileService";
import { type UserProfile } from "@/types/user";
import { User, Save } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MixedText } from "@/components/ui/MixedText";
import { useAuth } from "@/contexts/AuthContext";


export function UserProfileSetting() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        displayName: '',
        bio: ''
    });
    const { notify } = useNotification();
    const { user } = useAuth(); // 获取当前用户信息

    // 加载用户资料
    const loadUserProfile = useCallback(async () => {
        try {
            // 使用ensureUserProfile确保用户资料存在
            const userProfile = await UserProfileService.ensureUserProfile();
            setProfile(userProfile);
            if (userProfile) {
                setFormData({
                    username: userProfile.username || '',
                    displayName: userProfile.display_name || '',
                    bio: userProfile.bio || ''
                });
            }
        } catch (error) {
            console.error('加载用户资料失败:', error);
            notify({
                type: 'error',
                message: '加载用户资料失败',
                description: '请稍后重试'
            });
        }
    }, [notify]);

    useEffect(() => {
        loadUserProfile();
    }, [loadUserProfile]);

    // 保存用户资料
    const handleSaveProfile = async () => {
        try {
            await UserProfileService.upsertUserProfile({
                username: formData.username,
                display_name: formData.displayName,
                bio: formData.bio
            });

            await loadUserProfile(); // 重新加载资料

            notify({
                type: 'success',
                message: '保存成功',
                description: '用户资料已更新'
            });
        } catch (error) {
            console.error('保存用户资料失败:', error);
            notify({
                type: 'error',
                message: '保存失败',
                description: '请稍后重试'
            });
        }
    };

    const getDisplayName = () => {
        return profile?.display_name || profile?.username || '未设置';
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle><MixedText text="个人资料设置" /></CardTitle>
                <CardDescription>
                    <MixedText text="管理您的个人信息和账户设置" />
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* 用户头像显示 */}
                <div className="space-y-2">
                    <Label><MixedText text="用户头像" /></Label>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarFallback>
                                <User className="h-8 w-8" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            <MixedText text="使用默认头像" />
                        </div>
                    </div>
                </div>

                {/* 用户名设置 */}
                <div className="space-y-2">
                    <Label htmlFor="username"><MixedText text="用户名" /></Label>
                    <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="请输入用户名"
                        maxLength={20}
                    />
                    <p className="text-xs text-muted-foreground">
                        <MixedText text="用户名用于登录和显示，最多20个字符" />
                    </p>
                </div>

                {/* 显示名称设置 */}
                <div className="space-y-2">
                    <Label htmlFor="displayName"><MixedText text="显示名称" /></Label>
                    <Input
                        id="displayName"
                        value={formData.displayName}
                        onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                        placeholder="请输入显示名称"
                        maxLength={30}
                    />
                    <p className="text-xs text-muted-foreground">
                        <MixedText text="显示名称将作为您的主要标识，最多30个字符" />
                    </p>
                </div>

                {/* 个人简介设置 */}
                <div className="space-y-2">
                    <Label htmlFor="bio"><MixedText text="个人简介" /></Label>
                    <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="介绍一下自己..."
                        maxLength={200}
                        rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                        <MixedText text="个人简介最多200个字符" />
                    </p>
                </div>

                {/* 保存按钮 */}
                <div className="flex justify-end gap-2">
                    <Button
                        onClick={handleSaveProfile}
                        className="min-w-[100px]"
                    >
                        <Save className="h-4 w-4 mr-2" />
                        <MixedText text="保存" />
                    </Button>
                </div>

                {/* 当前信息预览 */}
                <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2"><MixedText text="当前信息" /></h4>
                    <div className="space-y-2 text-sm">
                        <div>
                            <span className="text-muted-foreground"><MixedText text="显示名称：" /></span>
                            <span><MixedText text={getDisplayName()} /></span>
                        </div>
                        <div>
                            <span className="text-muted-foreground"><MixedText text="用户名：" /></span>
                            <span><MixedText text={profile?.username || '未设置'} /></span>
                        </div>
                        <div>
                            <span className="text-muted-foreground"><MixedText text="邮箱：" /></span>
                            <span><MixedText text={profile?.email || user?.email || '未设置'} /></span>
                        </div>
                        <div>
                            <span className="text-muted-foreground"><MixedText text="个人简介：" /></span>
                            <span><MixedText text={profile?.bio || '未设置'} /></span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
} 