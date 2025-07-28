import { NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import { join } from 'path';

export async function GET() {
    try {
        // 读取public/ImageOfKnow文件夹
        const imageDir = join(process.cwd(), 'public', 'ImageOfKnow');
        const files = await readdir(imageDir);

        // 过滤出图片文件
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
        const imageFiles = files.filter(file => {
            const ext = file.toLowerCase();
            return imageExtensions.some(extension => ext.endsWith(extension));
        });

        return NextResponse.json(imageFiles);
    } catch (error) {
        console.error('读取图片文件夹失败:', error);
        return NextResponse.json([], { status: 500 });
    }
} 