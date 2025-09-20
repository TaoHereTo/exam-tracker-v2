import { supabase } from '@/supabaseClient';

export interface SupabaseImageInfo {
    id: string;
    fileName: string;
    originalName: string;
    size: number;
    type: string;
    url: string;
    uploadedAt: string;
    bucket: string;
}

export class SupabaseImageManager {
    private static instance: SupabaseImageManager;
    private readonly BUCKET_NAME = 'knowledge-images';
    private readonly STORAGE_KEY = 'exam-tracker-supabase-images-v1';

    private constructor() { }

    public static getInstance(): SupabaseImageManager {
        if (!SupabaseImageManager.instance) {
            SupabaseImageManager.instance = new SupabaseImageManager();
        }
        return SupabaseImageManager.instance;
    }



    // 初始化存储桶（如果不存在）
    public async initializeBucket(): Promise<void> {
        // 直接假设存储桶存在，不进行创建操作
        // 如果存储桶不存在，会在上传时得到相应的错误信息
    }

    // 上传图片到 Supabase
    public async uploadImage(file: File): Promise<SupabaseImageInfo> {
        try {
            // 尝试初始化存储桶（但不强制要求成功）
            try {
                await this.initializeBucket();
            } catch (error) {
                // 存储桶初始化失败，继续尝试上传
            }

            // 清理文件名，移除特殊字符和中文，只保留字母、数字、下划线和连字符
            const fileExtension = file.name.split('.').pop()?.toLowerCase();
            const baseName = file.name.replace(/\.[^/.]+$/, ''); // 移除扩展名

            // 清理基础文件名，只保留安全的字符
            const cleanBaseName = baseName
                .replace(/[^a-zA-Z0-9_-]/g, '_') // 将非字母数字字符替换为下划线
                .replace(/_+/g, '_') // 将多个连续下划线替换为单个下划线
                .replace(/^_|_$/g, ''); // 移除开头和结尾的下划线

            // 生成安全的文件名
            let uniqueFileName = `${cleanBaseName}.${fileExtension}`;

            // 如果清理后的文件名为空，使用时间戳
            if (!cleanBaseName) {
                uniqueFileName = `image_${Date.now()}.${fileExtension}`;
            }

            // 检查文件是否已存在
            const { data: existingFiles } = await supabase.storage
                .from(this.BUCKET_NAME)
                .list('', { limit: 1000 });

            const existingFileNames = existingFiles?.map(f => f.name) || [];

            // 如果文件名已存在，则添加时间戳
            if (existingFileNames.includes(uniqueFileName)) {
                const timestamp = Date.now();
                uniqueFileName = `${cleanBaseName}_${timestamp}.${fileExtension}`;
            }

            // 尝试上传文件
            const { data, error } = await supabase.storage
                .from(this.BUCKET_NAME)
                .upload(uniqueFileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                // 如果是权限错误，提供更详细的错误信息
                if (error.message.includes('row-level security') || error.message.includes('RLS')) {
                    throw new Error('权限不足：请检查 Supabase 存储桶的 RLS 策略设置。请执行 SUPABASE_RLS_FIX.sql 中的 SQL 命令。');
                } else if (error.message.includes('bucket')) {
                    throw new Error('存储桶不存在或无法访问：请手动创建存储桶或检查权限');
                } else {
                    throw new Error(`图片上传失败: ${error.message}`);
                }
            }

            // 获取公共URL
            const { data: urlData } = supabase.storage
                .from(this.BUCKET_NAME)
                .getPublicUrl(uniqueFileName);

            // 创建图片信息
            const imageInfo: SupabaseImageInfo = {
                id: data.path,
                fileName: uniqueFileName,
                originalName: file.name,
                size: file.size,
                type: file.type,
                url: urlData.publicUrl,
                uploadedAt: new Date().toISOString(),
                bucket: this.BUCKET_NAME
            };

            // 保存到本地存储
            this.saveImageInfo(imageInfo);

            return imageInfo;
        } catch (error) {
            // 不重新抛出错误，而是返回一个错误对象，避免页面崩溃
            throw new Error(`上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }

    // 从 Supabase 获取所有图片
    public async getAllImages(): Promise<SupabaseImageInfo[]> {
        try {
            // 检查环境变量
            if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
                console.warn('Supabase 环境变量未配置，返回本地存储的图片信息');
                return this.getAllLocalImageInfo();
            }

            const { data, error } = await supabase.storage
                .from(this.BUCKET_NAME)
                .list('', {
                    limit: 100,
                    offset: 0,
                    sortBy: { column: 'created_at', order: 'desc' }
                });

            if (error) {
                console.warn('从 Supabase 获取图片列表失败:', error);
                // 如果远程获取失败，返回本地存储的图片信息
                return this.getAllLocalImageInfo();
            }

            // 过滤掉占位符文件和无效文件
            const validFiles = (data || []).filter(file => {
                const invalidPatterns = [
                    'emptyFolderPlaceholder',
                    '.emptyFolderPlaceholder',
                    'undefined',
                    'null',
                    '.DS_Store',
                    'Thumbs.db',
                    'placeholder',
                    '.placeholder'
                ];

                // 检查文件名是否包含无效模式
                const hasInvalidPattern = invalidPatterns.some(pattern =>
                    file.name.includes(pattern)
                );

                // 检查文件大小是否为0（可能是占位符文件）
                const isZeroSize = file.metadata?.size === 0;

                // 检查文件名是否以点开头（隐藏文件）
                const isHiddenFile = file.name.startsWith('.');

                return !hasInvalidPattern && !isZeroSize && !isHiddenFile;
            });

            // 获取本地存储的图片信息
            const localImages = this.getAllLocalImageInfo();
            const localImageMap = new Map(localImages.map(img => [img.id, img]));

            // 合并远程和本地信息
            const images: SupabaseImageInfo[] = [];
            for (const file of validFiles) {
                const localInfo = localImageMap.get(file.name);

                // 重新生成公共URL
                const { data: urlData } = supabase.storage
                    .from(this.BUCKET_NAME)
                    .getPublicUrl(file.name);



                if (localInfo) {
                    // 使用本地信息（包含原始文件名等），但更新URL
                    images.push({
                        ...localInfo,
                        url: urlData.publicUrl,
                        size: file.metadata?.size || localInfo.size
                    });
                } else {
                    // 创建新的图片信息
                    images.push({
                        id: file.name,
                        fileName: file.name,
                        originalName: file.name,
                        size: file.metadata?.size || 0,
                        type: file.metadata?.mimetype || 'image/*',
                        url: urlData.publicUrl,
                        uploadedAt: file.created_at || new Date().toISOString(),
                        bucket: this.BUCKET_NAME
                    });
                }
            }

            return images;
        } catch (error) {
            // 如果远程获取失败，返回本地存储的图片信息
            return this.getAllLocalImageInfo();
        }
    }

    // 删除图片
    public async deleteImage(imageId: string): Promise<boolean> {
        try {
            const { error } = await supabase.storage
                .from(this.BUCKET_NAME)
                .remove([imageId]);

            if (error) {
                return false;
            }

            // 从本地存储中删除
            this.deleteLocalImageInfo(imageId);

            return true;
        } catch (error) {
            return false;
        }
    }

    // 获取图片信息
    public getImageInfo(imageId: string): SupabaseImageInfo | undefined {
        const images = this.getAllLocalImageInfo();
        return images.find(img => img.id === imageId);
    }

    // 获取图片URL - 添加重试机制和更好的错误处理
    public getImageUrl(imageId: string): string | null {
        try {
            // 兼容含路径的 imageId（例如 folder/subfolder/file.png）
            // 仅对不允许的字符做清理，保留路径分隔符 '/'
            const cleanImageId = imageId.replace(/[^a-zA-Z0-9._\/-]/g, '_');

            // 首先尝试从本地存储获取图片信息
            const imageInfo = this.getImageInfo(cleanImageId) || this.getImageInfo(imageId);
            if (imageInfo) {
                // 如果本地存储的URL无效，尝试重新生成
                if (!imageInfo.url || imageInfo.url.includes('undefined')) {
                    const { data: urlData } = supabase.storage
                        .from(this.BUCKET_NAME)
                        .getPublicUrl(imageInfo.fileName || cleanImageId);

                    if (urlData?.publicUrl) {
                        // 更新本地存储的URL
                        const updatedInfo = { ...imageInfo, url: urlData.publicUrl };
                        this.saveImageInfo(updatedInfo);
                        return urlData.publicUrl;
                    }
                }
                return imageInfo.url || null;
            }

            // 如果本地没有找到，尝试直接从云端获取URL
            const { data: urlData } = supabase.storage
                .from(this.BUCKET_NAME)
                .getPublicUrl(cleanImageId);

            if (urlData?.publicUrl) {
                // 成功从云端获取图片URL，保存到本地
                const newImageInfo: SupabaseImageInfo = {
                    id: cleanImageId,
                    fileName: cleanImageId,
                    originalName: cleanImageId,
                    size: 0,
                    type: 'image/*',
                    url: urlData.publicUrl,
                    uploadedAt: new Date().toISOString(),
                    bucket: this.BUCKET_NAME
                };
                this.saveImageInfo(newImageInfo);
                return urlData.publicUrl;
            }

            return null;
        } catch (error) {
            console.warn('获取图片URL时出错:', error);
            return null;
        }
    }

    // 验证图片URL是否可访问
    public async validateImageUrl(url: string): Promise<boolean> {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    // 保存图片信息到本地存储
    private saveImageInfo(imageInfo: SupabaseImageInfo): void {
        try {
            const images = this.getAllLocalImageInfo();
            const existingIndex = images.findIndex(img => img.id === imageInfo.id);

            if (existingIndex >= 0) {
                images[existingIndex] = imageInfo;
            } else {
                images.push(imageInfo);
            }

            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(images));
        } catch (error) {
        }
    }

    // 获取所有本地图片信息
    public getAllLocalImageInfo(): SupabaseImageInfo[] {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            return [];
        }
    }

    // 删除本地图片信息
    private deleteLocalImageInfo(imageId: string): void {
        try {
            const images = this.getAllLocalImageInfo();
            const filteredImages = images.filter(img => img.id !== imageId);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredImages));
        } catch (error) {
        }
    }

    // 批量导入图片信息
    public importImageInfo(images: SupabaseImageInfo[]): void {
        try {
            const existingImages = this.getAllLocalImageInfo();
            const existingMap = new Map(existingImages.map(img => [img.id, img]));

            images.forEach(img => {
                existingMap.set(img.id, img);
            });

            const allImages = Array.from(existingMap.values());
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allImages));
        } catch (error) {
        }
    }

    // 清理未使用的图片信息
    public cleanupUnusedImageInfo(usedImageIds: string[]): void {
        try {
            const images = this.getAllLocalImageInfo();
            const usedSet = new Set(usedImageIds);
            const filteredImages = images.filter(img => usedSet.has(img.id));
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredImages));
        } catch (error) {
        }
    }

    // 获取存储统计信息
    public getStorageStats(): { totalImages: number; totalSize: number } {
        const images = this.getAllLocalImageInfo();
        const totalSize = images.reduce((sum, img) => sum + img.size, 0);
        return {
            totalImages: images.length,
            totalSize
        };
    }

    // 清理无效的图片记录
    public cleanupInvalidImageRecords(): void {
        try {
            const images = this.getAllLocalImageInfo();
            const validImages = images.filter(img => {
                // 过滤掉无效的图片记录
                const invalidPatterns = [
                    'emptyFolderPlaceholder',
                    '.emptyFolderPlaceholder',
                    'undefined',
                    'null',
                    '.DS_Store',
                    'Thumbs.db',
                    'placeholder',
                    '.placeholder'
                ];

                // 检查文件名是否包含无效模式
                const hasInvalidPattern = invalidPatterns.some(pattern =>
                    img.id.includes(pattern) ||
                    img.fileName.includes(pattern) ||
                    img.originalName.includes(pattern)
                );

                // 检查文件大小是否为0（可能是占位符文件）
                const isZeroSize = img.size === 0;

                // 检查文件名是否以点开头（隐藏文件）
                const isHiddenFile = img.fileName.startsWith('.') || img.originalName.startsWith('.');

                return !hasInvalidPattern && !isZeroSize && !isHiddenFile;
            });

            if (validImages.length !== images.length) {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(validImages));
            }
        } catch (error) {
        }
    }
}

// 导出单例实例
export const supabaseImageManager = SupabaseImageManager.getInstance(); 