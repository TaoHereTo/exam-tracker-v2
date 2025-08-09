// 用户资料类型定义
export interface UserProfile {
    id: string;
    user_id: string;
    username?: string;
    email?: string;
    display_name?: string;
    bio?: string;
    created_at: string;
    updated_at: string;
}

export interface UserProfileInput {
    username?: string | null;
    email?: string | null;
    display_name?: string | null;
    bio?: string | null;
}

export interface AvatarOption {
    id: string;
    name: string;
    emoji: string;
    url: string;
}

// 头像分类
export interface AvatarCategory {
    name: string;
    avatars: AvatarOption[];
}

// 预设头像选项 - 按分类组织
export const AVATAR_CATEGORIES: Record<string, AvatarCategory> = {
    cool: {
        name: '酷炫',
        avatars: [
            { id: 'ninja', name: '忍者', url: '/api/avatars/ninja', emoji: '🥷' },
            { id: 'astronaut', name: '宇航员', url: '/api/avatars/astronaut', emoji: '👨‍🚀' },
            { id: 'detective', name: '侦探', url: '/api/avatars/detective', emoji: '🕵️' },
            { id: 'scientist', name: '科学家', url: '/api/avatars/scientist', emoji: '👨‍🔬' },
            { id: 'pilot', name: '飞行员', url: '/api/avatars/pilot', emoji: '👨‍✈️' },
        ]
    },
    tech: {
        name: '科技',
        avatars: [
            { id: 'rocket', name: '火箭', url: '/api/avatars/rocket', emoji: '🚀' },
            { id: 'laptop', name: '电脑', url: '/api/avatars/laptop', emoji: '💻' },
            { id: 'phone', name: '手机', url: '/api/avatars/phone', emoji: '📱' },
            { id: 'robot', name: '机器人', url: '/api/avatars/robot', emoji: '🤖' },
            { id: 'satellite', name: '卫星', url: '/api/avatars/satellite', emoji: '🛰️' },
        ]
    },
    nature: {
        name: '自然',
        avatars: [
            { id: 'thunder', name: '闪电', url: '/api/avatars/thunder', emoji: '⚡' },
            { id: 'fire', name: '火焰', url: '/api/avatars/fire', emoji: '🔥' },
            { id: 'mountain', name: '山峰', url: '/api/avatars/mountain', emoji: '⛰️' },
            { id: 'ocean', name: '海洋', url: '/api/avatars/ocean', emoji: '🌊' },
            { id: 'galaxy', name: '银河', url: '/api/avatars/galaxy', emoji: '🌌' },
        ]
    }
};

// 兼容旧版本
export const DEFAULT_AVATARS: AvatarOption[] = AVATAR_CATEGORIES.cool.avatars.slice(0, 6); 