import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useNotification } from "@/components/magicui/NotificationProvider";
import { UserProfileService } from "@/lib/userProfileService";
import { DEFAULT_AVATARS, type UserProfile, type AvatarOption } from "@/types/user";
import { User, Camera, Save, X } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MixedText } from "@/components/ui/MixedText";
import { UsernameChecker } from "@/components/ui/UsernameChecker";
import { useAuth } from "@/contexts/AuthContext";

export function UserProfileSetting() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        displayName: '',
        bio: ''
    });
    const { notify } = useNotification();
    const { user } = useAuth(); // 获取当前用户信息

    // 加载用户资料
    useEffect(() => {
        loadUserProfile();
    }, []);

    const loadUserProfile = async () => {
        try {
            setLoading(true);
            const userProfile = await UserProfileService.getUserProfile();
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
        } finally {
            setLoading(false);
        }
    };

    // 保存用户资料
    const handleSaveProfile = async () => {
        try {
            setLoading(true);
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
        } finally {
            setLoading(false);
        }
    };

    // 选择头像
    const handleSelectAvatar = async (avatar: AvatarOption) => {
        try {
            setLoading(true);
            await UserProfileService.updateAvatar(avatar.url);
            await loadUserProfile();
            setAvatarDialogOpen(false);

            notify({
                type: 'success',
                message: '头像更新成功',
                description: '您的头像已更新'
            });
        } catch (error) {
            console.error('更新头像失败:', error);
            notify({
                type: 'error',
                message: '更新头像失败',
                description: '请稍后重试'
            });
        } finally {
            setLoading(false);
        }
    };

    const getCurrentAvatar = () => {
        if (!profile?.avatar_url) return DEFAULT_AVATARS[0];
        return DEFAULT_AVATARS.find(avatar => avatar.url === profile.avatar_url) || DEFAULT_AVATARS[0];
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
            <CardContent className="space-y-6">
                {/* 头像设置 */}
                <div className="space-y-2">
                    <Label><MixedText text="头像" /></Label>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={getCurrentAvatar().url} alt="用户头像" />
                            <AvatarFallback>
                                <User className="h-8 w-8" />
                            </AvatarFallback>
                        </Avatar>
                        <Dialog open={avatarDialogOpen} onOpenChange={setAvatarDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Camera className="h-4 w-4 mr-2" />
                                    <MixedText text="更换头像" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                    <DialogTitle><MixedText text="选择头像" /></DialogTitle>
                                </DialogHeader>
                                <div className="grid grid-cols-4 gap-2">
                                    {DEFAULT_AVATARS.map((avatar) => (
                                        <button
                                            key={avatar.id}
                                            onClick={() => handleSelectAvatar(avatar)}
                                            className="p-4 rounded-lg border-2 hover:border-primary transition-colors"
                                        >
                                            <div className="text-3xl mb-2"><MixedText text={avatar.emoji} /></div>
                                            <div className="text-xs text-center"><MixedText text={avatar.name} /></div>
                                        </button>
                                    ))}
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* 用户名设置 */}
                <div className="space-y-2">
                    <UsernameChecker
                        value={formData.username}
                        onChange={(value) => setFormData(prev => ({ ...prev, username: value }))}
                        placeholder="请输入用户名"
                        label="用户名"
                        userEmail={user?.email} // 传递用户邮箱
                    />
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
                        disabled={loading}
                        className="min-w-[100px]"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                <MixedText text="保存" />
                            </>
                        )}
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
                            <span className="text-muted-foreground"><MixedText text="个人简介：" /></span>
                            <span><MixedText text={profile?.bio || '未设置'} /></span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
} 