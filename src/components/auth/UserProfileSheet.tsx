import React, { useState, useEffect, useCallback } from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetClose
} from "@/components/animate-ui/components/radix/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNotification } from "@/components/magicui/NotificationProvider";
import { UserProfileService } from "@/lib/userProfileService";
import { type UserProfile } from "@/types/user";
import { User, Save, X } from "lucide-react";
import { MixedText } from "@/components/ui/MixedText";
import { InlineLoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from "@/contexts/AuthContext";
import { useThemeMode } from "@/hooks/useThemeMode";
import { useLoading } from "@/hooks/useLoading";
import { useToast } from "@/hooks/useToast";

interface UserProfileSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onProfileUpdate?: () => void;
}

export function UserProfileSheet({ isOpen, onClose, onProfileUpdate }: UserProfileSheetProps) {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        motto: ''
    });

    const { notify } = useNotification();
    const { user } = useAuth();
    const { isDarkMode } = useThemeMode();
    const { loading, withLoading } = useLoading();
    const { showError } = useToast();

    // 加载用户资料
    const loadUserProfile = useCallback(async () => {
        try {
            // 直接获取用户资料，不确保存在
            const userProfile = await UserProfileService.getUserProfile();
            setProfile(userProfile);
            if (userProfile) {
                setFormData({
                    username: userProfile.username || '',
                    motto: userProfile.bio || ''
                });
            } else {
                // 如果资料不存在，设置默认值
                setFormData({
                    username: '',
                    motto: ''
                });
            }
        } catch (error) {
            console.error('加载用户资料失败:', error);
            showError('加载失败，请稍后重试');
        }
    }, [showError]);

    useEffect(() => {
        if (isOpen) {
            loadUserProfile();
        }
    }, [isOpen, loadUserProfile]);

    // 保存用户资料
    const handleSaveProfile = async () => {
        await withLoading(async () => {
            try {
                const updatedProfile = await UserProfileService.upsertUserProfile({
                    username: formData.username,
                    bio: formData.motto
                });

                if (updatedProfile) {
                    setProfile(updatedProfile);
                    onProfileUpdate?.(); // 通知父组件更新

                    notify({
                        type: 'success',
                        message: '保存成功'
                    });
                }
            } catch (error) {
                console.error('保存用户资料失败:', error);
                showError('保存失败，请稍后重试');
            }
        });
    };

    // 获取显示名称
    const getDisplayName = () => {
        if (profile?.username) {
            return profile.username;
        }
        return '未设置';
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="right" className="w-[350px] sm:w-[400px] p-6">
                <SheetHeader className="px-0 pb-4">
                    <SheetTitle className="flex items-center gap-2 text-xl font-bold">
                        <User className="w-6 h-6" />
                        <MixedText text="个人资料" />
                    </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col gap-6 px-0">
                    {/* 用户信息显示 */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">
                            <MixedText text="当前用户" />
                        </Label>
                        <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-sm">
                                <span className="font-medium"><MixedText text="邮箱" />: </span>
                                {user?.email || '未登录'}
                            </p>
                            <p className="text-sm">
                                <span className="font-medium"><MixedText text="用户名" />: </span>
                                {getDisplayName()}
                            </p>
                        </div>
                    </div>

                    {/* 表单 */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">
                                <MixedText text="用户名" />
                            </Label>
                            <Input
                                id="username"
                                value={formData.username}
                                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                                placeholder="请输入您的用户名"
                                className="w-full"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="motto">
                                <MixedText text="个人简介" />
                            </Label>
                            <Textarea
                                id="motto"
                                value={formData.motto}
                                onChange={(e) => setFormData(prev => ({ ...prev, motto: e.target.value }))}
                                placeholder="请输入您的个人简介"
                                className="w-full min-h-[100px] resize-none"
                            />
                        </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            onClick={handleSaveProfile}
                            disabled={loading}
                            className="flex-1 rounded-full bg-[#0d9488] hover:bg-[#0d9488]/90 text-white"
                        >
                            {loading ? (
                                <InlineLoadingSpinner />
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    <MixedText text="保存" />
                                </>
                            )}
                        </Button>
                        <SheetClose asChild>
                            <Button variant="outline" className="px-6 rounded-full">
                                <X className="w-4 h-4 mr-2" />
                                <MixedText text="关闭" />
                            </Button>
                        </SheetClose>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
