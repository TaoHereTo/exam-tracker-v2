import { NextRequest, NextResponse } from 'next/server';
import { supabaseImageManager } from '@/lib/supabaseImageManager';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: '没有找到文件' },
                { status: 400 }
            );
        }

        // 验证文件类型
        if (!file.type.startsWith('image/')) {
            return NextResponse.json(
                { error: '只支持图片文件' },
                { status: 400 }
            );
        }

        // 验证文件大小（5MB）
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json(
                { error: '文件大小不能超过5MB' },
                { status: 400 }
            );
        }

        // 上传图片到 Supabase
        const imageInfo = await supabaseImageManager.uploadImage(file);

        return NextResponse.json({
            success: true,
            imageInfo
        });

    } catch (error) {
        console.error('上传图片失败:', error);
        return NextResponse.json(
            {
                error: '上传失败',
                details: error instanceof Error ? error.message : '未知错误'
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        // 获取所有图片
        const images = await supabaseImageManager.getAllImages();

        return NextResponse.json({
            success: true,
            images
        });
    } catch (error) {
        console.error('获取图片列表失败:', error);
        return NextResponse.json(
            {
                error: '获取图片列表失败',
                details: error instanceof Error ? error.message : '未知错误'
            },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const imageId = searchParams.get('id');

        if (!imageId) {
            return NextResponse.json(
                { error: '缺少图片ID' },
                { status: 400 }
            );
        }

        // 删除图片
        const success = await supabaseImageManager.deleteImage(imageId);

        if (success) {
            return NextResponse.json({
                success: true,
                message: '图片删除成功'
            });
        } else {
            return NextResponse.json(
                { error: '删除失败' },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('删除图片失败:', error);
        return NextResponse.json(
            {
                error: '删除失败',
                details: error instanceof Error ? error.message : '未知错误'
            },
            { status: 500 }
        );
    }
} 