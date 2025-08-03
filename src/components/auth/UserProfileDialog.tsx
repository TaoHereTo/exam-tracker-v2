import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNotification } from "@/components/magicui/NotificationProvider";
import { UserProfileService } from "@/lib/userProfileService";
import { type UserProfile } from "@/types/user";
import { User, Save } from "lucide-react";
import { UsernameChecker } from "@/components/ui/UsernameChecker";
import { MixedText } from "@/components/ui/MixedText";

interface UserProfileDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onProfileUpdate?: () => void;
}

export function UserProfileDialog({ isOpen, onClose, onProfileUpdate }: UserProfileDialogProps) {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        displayName: '',
        motto: ''
    });
    const [isUsernameValid, setIsUsernameValid] = useState(true);
    const { notify } = useNotification();

    // 加载用户资料
    useEffect(() => {
        if (isOpen) {
            loadUserProfile();
        }
    }, [isOpen]);

    const loadUserProfile = async () => {
        try {
            setLoading(true);
            const userProfile = await UserProfileService.getUserProfile();
            setProfile(userProfile);
            if (userProfile) {
                setFormData({
                    username: userProfile.username || '',
                    displayName: userProfile.display_name || '',
                    motto: userProfile.bio || ''
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
        if (!isUsernameValid) {
            notify({
                type: 'error',
                message: '用户名无效',
                description: '请选择一个可用的用户名'
            });
            return;
        }

        try {
            setLoading(true);
            await UserProfileService.upsertUserProfile({
                username: formData.username,
                display_name: formData.displayName,
                bio: formData.motto
            });

            await loadUserProfile(); // 重新加载资料
            onProfileUpdate?.(); // 通知父组件更新

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



    // 获取显示名称
    const getDisplayName = () => {
        if (profile?.display_name) {
            return profile.display_name;
        }
        if (profile?.username) {
            return profile.username;
        }
        return '未设置';
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                        <UsernameChecker
                            value={formData.username}
                            onChange={(username) => setFormData(prev => ({ ...prev, username }))}
                            onValidationChange={setIsUsernameValid}
                            placeholder="请输入用户名"
                            label="用户名"
                        />
                        <p className="text-xs text-muted-foreground">
                            <MixedText text="用户名用于登录和显示，最多20个字符" />
                        </p>

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

                    {/* 当前信息预览 */}
                    <div className="pt-4 border-t">
                        <h4 className="font-medium mb-3"><MixedText text="当前信息" /></h4>
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
                                <span className="text-muted-foreground"><MixedText text="座右铭：" /></span>
                                <span><MixedText text={profile?.bio || '未设置'} /></span>
                            </div>
                        </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={onClose}>
                            <MixedText text="取消" />
                        </Button>
                        <Button
                            onClick={handleSaveProfile}
                            disabled={loading || !isUsernameValid}
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
                </div>
            </DialogContent>
        </Dialog>
    );
} 