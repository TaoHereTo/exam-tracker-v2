import { NextRequest, NextResponse } from 'next/server';

// 头像的SVG模板
const avatarTemplates: Record<string, { emoji: string; color: string; bgColor: string }> = {
    // 动物类
    'cat': { emoji: '🐱', color: '#F59E0B', bgColor: '#FEF3C7' },
    'dog': { emoji: '🐕', color: '#8B5CF6', bgColor: '#EDE9FE' },
    'panda': { emoji: '🐼', color: '#000000', bgColor: '#F3F4F6' },
    'tiger': { emoji: '🐯', color: '#F59E0B', bgColor: '#FEF3C7' },
    'lion': { emoji: '🦁', color: '#F59E0B', bgColor: '#FEF3C7' },
    'fox': { emoji: '🦊', color: '#F97316', bgColor: '#FED7AA' },
    'rabbit': { emoji: '🐰', color: '#EC4899', bgColor: '#FCE7F3' },
    'bear': { emoji: '🐻', color: '#8B4513', bgColor: '#F5DEB3' },
    'wolf': { emoji: '🐺', color: '#6B7280', bgColor: '#F3F4F6' },
    'deer': { emoji: '🦌', color: '#8B4513', bgColor: '#F5DEB3' },
    'elephant': { emoji: '🐘', color: '#6B7280', bgColor: '#F3F4F6' },
    'giraffe': { emoji: '🦒', color: '#F59E0B', bgColor: '#FEF3C7' },

    // 人物类
    'ninja': { emoji: '🥷', color: '#1F2937', bgColor: '#E5E7EB' },
    'astronaut': { emoji: '👨‍🚀', color: '#3B82F6', bgColor: '#DBEAFE' },
    'detective': { emoji: '🕵️', color: '#1F2937', bgColor: '#E5E7EB' },
    'chef': { emoji: '👨‍🍳', color: '#EF4444', bgColor: '#FEE2E2' },
    'doctor': { emoji: '👨‍⚕️', color: '#10B981', bgColor: '#D1FAE5' },
    'teacher': { emoji: '👨‍🏫', color: '#8B5CF6', bgColor: '#EDE9FE' },
    'artist': { emoji: '👨‍🎨', color: '#EC4899', bgColor: '#FCE7F3' },
    'scientist': { emoji: '👨‍🔬', color: '#3B82F6', bgColor: '#DBEAFE' },
    'pilot': { emoji: '👨‍✈️', color: '#1F2937', bgColor: '#E5E7EB' },
    'firefighter': { emoji: '👨‍🚒', color: '#EF4444', bgColor: '#FEE2E2' },
    'police': { emoji: '👮', color: '#3B82F6', bgColor: '#DBEAFE' },
    'farmer': { emoji: '👨‍🌾', color: '#10B981', bgColor: '#D1FAE5' },

    // 物品类
    'crown': { emoji: '👑', color: '#F59E0B', bgColor: '#FEF3C7' },
    'star': { emoji: '⭐', color: '#F59E0B', bgColor: '#FEF3C7' },
    'heart': { emoji: '❤️', color: '#EF4444', bgColor: '#FEE2E2' },
    'diamond': { emoji: '💎', color: '#8B5CF6', bgColor: '#EDE9FE' },
    'rocket': { emoji: '🚀', color: '#EF4444', bgColor: '#FEE2E2' },
    'car': { emoji: '🚗', color: '#3B82F6', bgColor: '#DBEAFE' },
    'plane': { emoji: '✈️', color: '#3B82F6', bgColor: '#DBEAFE' },
    'ship': { emoji: '🚢', color: '#3B82F6', bgColor: '#DBEAFE' },
    'bike': { emoji: '🚲', color: '#10B981', bgColor: '#D1FAE5' },
    'book': { emoji: '📚', color: '#8B5CF6', bgColor: '#EDE9FE' },
    'laptop': { emoji: '💻', color: '#6B7280', bgColor: '#F3F4F6' },
    'phone': { emoji: '📱', color: '#3B82F6', bgColor: '#DBEAFE' },

    // 自然类
    'sun': { emoji: '☀️', color: '#F59E0B', bgColor: '#FEF3C7' },
    'moon': { emoji: '🌙', color: '#8B5CF6', bgColor: '#EDE9FE' },
    'cloud': { emoji: '☁️', color: '#6B7280', bgColor: '#F3F4F6' },
    'rainbow': { emoji: '🌈', color: '#EC4899', bgColor: '#FCE7F3' },
    'flower': { emoji: '🌸', color: '#EC4899', bgColor: '#FCE7F3' },
    'tree': { emoji: '🌳', color: '#10B981', bgColor: '#D1FAE5' },
    'leaf': { emoji: '🍃', color: '#10B981', bgColor: '#D1FAE5' },
    'mountain': { emoji: '⛰️', color: '#6B7280', bgColor: '#F3F4F6' },
    'ocean': { emoji: '🌊', color: '#3B82F6', bgColor: '#DBEAFE' },
    'fire': { emoji: '🔥', color: '#EF4444', bgColor: '#FEE2E2' },
    'snow': { emoji: '❄️', color: '#3B82F6', bgColor: '#DBEAFE' },
    'thunder': { emoji: '⚡', color: '#F59E0B', bgColor: '#FEF3C7' },

    // 兼容旧版本
    'default-1': { emoji: '👤', color: '#3B82F6', bgColor: '#DBEAFE' },
    'default-2': { emoji: '🎯', color: '#10B981', bgColor: '#D1FAE5' },
    'default-3': { emoji: '📚', color: '#8B5CF6', bgColor: '#EDE9FE' },
    'default-4': { emoji: '🚀', color: '#F59E0B', bgColor: '#FEF3C7' },
    'default-5': { emoji: '⭐', color: '#EF4444', bgColor: '#FEE2E2' },
    'default-6': { emoji: '🎨', color: '#EC4899', bgColor: '#FCE7F3' }
};

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const template = avatarTemplates[id as keyof typeof avatarTemplates];

    if (!template) {
        return new NextResponse('Avatar not found', { status: 404 });
    }

    // 生成SVG头像
    const svg = `
        <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:${template.bgColor};stop-opacity:1" />
                    <stop offset="100%" style="stop-color:${template.color};stop-opacity:0.3" />
                </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="50" fill="url(#bg)" />
            <text x="50" y="58" font-family="Arial, sans-serif" font-size="36" text-anchor="middle" dominant-baseline="middle" fill="${template.color}">
                ${template.emoji}
            </text>
        </svg>
    `;

    return new NextResponse(svg, {
        headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=31536000, immutable'
        }
    });
} 