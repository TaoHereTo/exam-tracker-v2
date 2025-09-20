import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNotification } from "@/components/magicui/NotificationProvider";
import { UserProfileService } from "@/lib/userProfileService";
import { type UserProfile } from "@/types/user";
import { User, Save } from "lucide-react";
import { MixedText } from "@/components/ui/MixedText";
import { InlineLoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from "@/contexts/AuthContext";
import { useThemeMode } from "@/hooks/useThemeMode";
import { useLoading } from "@/hooks/useLoading";
import { useToast } from "@/hooks/useToast";
import { UiverseSpinner } from '@/components/ui/UiverseSpinner';

interface UserProfileDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onProfileUpdate?: () => void;
}

export function UserProfileDialog({ isOpen, onClose, onProfileUpdate }: UserProfileDialogProps) {
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
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-xl w-[500px] sm:w-[550px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        <MixedText text="个人资料设置" />
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* 个人信息设置 */}
                    <div className="space-y-4">
                        <h3 className="font-medium"><MixedText text="个人信息" /></h3>

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

                        {/* 座右铭设置 */}
                        <div className="space-y-2">
                            <Label htmlFor="motto"><MixedText text="座右铭" /></Label>
                            <Textarea
                                id="motto"
                                value={formData.motto}
                                onChange={(e) => setFormData(prev => ({ ...prev, motto: e.target.value }))}
                                placeholder="写下一句激励自己的话..."
                                maxLength={100}
                                rows={2}
                            />
                            <p className="text-xs text-muted-foreground">
                                <MixedText text="座右铭最多100个字符" />
                            </p>
                        </div>
                    </div>


                    {/* 操作按钮 */}
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={onClose} className="h-10 rounded-full">
                            <MixedText text="取消" />
                        </Button>
                        <Button
                            type="submit"
                            variant="default"
                            disabled={loading}
                            onClick={handleSaveProfile}
                            className="flex items-center justify-center h-10 rounded-full"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center w-full">
                                    <UiverseSpinner size={18} className="inline-block" />
                                    <span className="ml-2"><MixedText text="更新中..." /></span>
                                </div>
                            ) : (
                                <MixedText text="更新资料" />
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}