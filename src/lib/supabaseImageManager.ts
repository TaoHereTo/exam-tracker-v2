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

    // 测试 Supabase 连接和权限
    public async testConnection(): Promise<{ success: boolean; message: string }> {
        try {
            // 首先尝试直接访问存储桶，如果成功说明存储桶存在且可访问
            const { data: files, error: filesError } = await supabase.storage
                .from(this.BUCKET_NAME)
                .list('', { limit: 1 });

            if (filesError) {
                // 如果无法列出文件，尝试列出存储桶
                const { data: buckets, error: listError } = await supabase.storage.listBuckets();

                if (listError) {
                    return {
                        success: false,
                        message: `无法访问存储服务: ${listError.message}`
                    };
                }

                // 检查目标存储桶是否存在
                const bucketExists = buckets?.some(bucket => bucket.name === this.BUCKET_NAME);

                if (!bucketExists) {
                    return {
                        success: false,
                        message: `存储桶 '${this.BUCKET_NAME}' 不存在，请手动创建`
                    };
                }

                return {
                    success: false,
                    message: `存储桶存在但无法访问文件: ${filesError.message}`
                };
            }

            // 如果能成功列出文件，说明连接正常
            let message = '连接正常，权限配置正确';

            // 检查是否有文件，如果有则测试URL生成
            if (files && files.length > 0) {
                const testFile = files[0];
                const { data: urlData } = supabase.storage
                    .from(this.BUCKET_NAME)
                    .getPublicUrl(testFile.name);



                // 测试URL是否可访问
                try {
                    const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
                    if (response.ok) {
                        message += '，图片URL可正常访问';
                    } else {
                        message += `，但图片URL访问失败 (${response.status})`;
                    }
                } catch {
                    message += '，但图片URL访问失败 (网络错误)';
                }
            } else {
                message += '，存储桶为空';
            }

            return {
                success: true,
                message
            };
        } catch (error) {
            return {
                success: false,
                message: `连接测试失败: ${error instanceof Error ? error.message : '未知错误'}`
            };
        }
    }

    // 初始化存储桶（如果不存在）
    public async initializeBucket(): Promise<void> {
        try {
            // 首先尝试列出存储桶
            const { data: buckets, error: listError } = await supabase.storage.listBuckets();

            if (listError) {

                // 无法列出存储桶，可能是权限问题，继续尝试使用现有存储桶
                return;
            }

            const bucketExists = buckets?.some(bucket => bucket.name === this.BUCKET_NAME);

            if (!bucketExists) {

                // 尝试创建存储桶
                const { error: createError } = await supabase.storage.createBucket(this.BUCKET_NAME, {
                    public: true,
                    allowedMimeTypes: ['image/*'],
                    fileSizeLimit: 5242880 // 5MB
                });

                if (createError) {
                    // 存储桶可能已存在，继续使用现有存储桶
                    return;
                }
            }
        } catch (error) {
            console.error('初始化存储桶时出现问题:', error);
            // 不抛出错误，让程序继续运行
        }
    }

    // 上传图片到 Supabase
    public async uploadImage(file: File): Promise<SupabaseImageInfo> {
        try {
            console.log('开始上传图片:', file.name, file.size, file.type);
            console.log('Supabase客户端状态:', !!supabase);

            // 尝试初始化存储桶（但不强制要求成功）
            await this.initializeBucket();

            // 生成唯一的文件名
            const fileExtension = file.name.split('.').pop();
            const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;

            // 尝试上传文件
            const { data, error } = await supabase.storage
                .from(this.BUCKET_NAME)
                .upload(uniqueFileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error('上传图片失败:', error);
                console.error('错误详情:', {
                    message: error.message,
                    name: error.name
                });

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
            console.error('上传图片失败:', error);
            // 不重新抛出错误，而是返回一个错误对象，避免页面崩溃
            throw new Error(`上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }

    // 从 Supabase 获取所有图片
    public async getAllImages(): Promise<SupabaseImageInfo[]> {
        try {
            const { data, error } = await supabase.storage
                .from(this.BUCKET_NAME)
                .list('', {
                    limit: 100,
                    offset: 0,
                    sortBy: { column: 'created_at', order: 'desc' }
                });

            if (error) {
                console.error('获取图片列表失败:', error);
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
            console.error('获取图片列表失败:', error);
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
                console.error('删除图片失败:', error);
                return false;
            }

            // 从本地存储中删除
            this.deleteLocalImageInfo(imageId);

            return true;
        } catch (error) {
            console.error('删除图片失败:', error);
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
            // 首先尝试从本地存储获取图片信息
            const imageInfo = this.getImageInfo(imageId);
            if (imageInfo) {
                // 如果本地存储的URL无效，尝试重新生成
                if (!imageInfo.url || imageInfo.url.includes('undefined')) {
                    const { data: urlData } = supabase.storage
                        .from(this.BUCKET_NAME)
                        .getPublicUrl(imageInfo.fileName);

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
            // 本地未找到图片信息，尝试从云端获取
            const { data: urlData } = supabase.storage
                .from(this.BUCKET_NAME)
                .getPublicUrl(imageId);

            if (urlData?.publicUrl) {
                // 成功从云端获取图片URL
                return urlData.publicUrl;
            }

            console.warn(`未找到图片信息: ${imageId}`);
            return null;
        } catch (error) {
            console.error('获取图片URL失败:', error);
            return null;
        }
    }

    // 验证图片URL是否可访问
    public async validateImageUrl(url: string): Promise<boolean> {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            console.error('验证图片URL失败:', error);
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
            console.error('保存图片信息失败:', error);
        }
    }

    // 获取所有本地图片信息
    public getAllLocalImageInfo(): SupabaseImageInfo[] {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('获取本地图片信息失败:', error);
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
            console.error('删除本地图片信息失败:', error);
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
            console.error('导入图片信息失败:', error);
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
            console.error('清理未使用的图片信息失败:', error);
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
                console.log(`清理了 ${images.length - validImages.length} 个无效的图片记录`);
            }
        } catch (error) {
            console.error('清理无效图片记录失败:', error);
        }
    }
}

// 导出单例实例
export const supabaseImageManager = SupabaseImageManager.getInstance(); 