// 静态图片管理器 - 直接访问public文件夹中的图片
export interface StaticImageInfo {
    id: string;
    fileName: string;
    originalName: string;
    size?: number;
    type?: string;
    localPath: string; // 静态文件路径
}

export class StaticImageManager {
    private static instance: StaticImageManager;
    private readonly STORAGE_KEY = 'exam-tracker-static-images-v1';
    private readonly IMAGE_DIR = '/ImageOfKnow/'; // 相对于public文件夹的路径

    private constructor() { }

    public static getInstance(): StaticImageManager {
        if (!StaticImageManager.instance) {
            StaticImageManager.instance = new StaticImageManager();
        }
        return StaticImageManager.instance;
    }

    // 获取已选择的图片映射信息
    private getSelectedImageMap(): Map<string, StaticImageInfo> {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const imageArray = JSON.parse(stored) as StaticImageInfo[];
                return new Map(imageArray.map(img => [img.id, img]));
            }
        } catch (error) {
            console.error('加载图片映射失败:', error);
        }
        return new Map();
    }

    // 保存图片映射信息
    private saveImageMap(imageMap: Map<string, StaticImageInfo>): void {
        try {
            const imageArray = Array.from(imageMap.values());
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(imageArray));
        } catch (error) {
            console.error('保存图片映射失败:', error);
        }
    }

    // 生成唯一的图片ID
    private generateImageId(): string {
        return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }



    // 获取所有可用的图片文件列表
    public async getAvailableImages(): Promise<string[]> {
        try {
            // 动态获取ImageOfKnow文件夹中的图片文件
            const response = await fetch('/api/images');
            if (response.ok) {
                const images = await response.json();
                return images;
            }

            // 如果API不可用，尝试直接读取文件夹（仅开发环境）
            if (process.env.NODE_ENV === 'development') {
                // 在开发环境中，我们可以尝试直接访问文件夹
                // 这里返回一个基本的列表，实际项目中应该通过API获取
                return ['1.png'];
            }

            return [];
        } catch (error) {
            console.error('获取可用图片列表失败:', error);
            return [];
        }
    }

    // 从预定义列表中选择图片
    public async selectImageFromList(): Promise<string> {
        try {
            // 这里可以弹出一个选择对话框让用户选择图片
            // 暂时返回第一个可用的图片作为示例
            const availableImages = await this.getAvailableImages();
            if (availableImages.length === 0) {
                throw new Error('没有可用的图片文件');
            }

            const fileName = availableImages[0]; // 这里可以改为用户选择
            const imageId = this.generateImageId();

            // 创建图片信息
            const imageInfo: StaticImageInfo = {
                id: imageId,
                fileName: fileName,
                originalName: fileName,
                localPath: `${this.IMAGE_DIR}${fileName}` // 静态文件路径
            };

            // 保存选择信息到 localStorage
            const imageMap = this.getSelectedImageMap();
            imageMap.set(imageId, imageInfo);
            this.saveImageMap(imageMap);

            return imageId;
        } catch (error) {
            console.error('选择图片失败:', error);
            throw new Error('选择图片失败');
        }
    }

    // 通过文件名直接选择图片
    public selectImageByFileName(fileName: string): string {
        const imageId = this.generateImageId();

        // 创建图片信息
        const imageInfo: StaticImageInfo = {
            id: imageId,
            fileName: fileName,
            originalName: fileName,
            localPath: `${this.IMAGE_DIR}${fileName}` // 静态文件路径
        };

        // 保存选择信息到 localStorage
        const imageMap = this.getSelectedImageMap();
        imageMap.set(imageId, imageInfo);
        this.saveImageMap(imageMap);


        return imageId;
    }

    // 获取图片信息
    public getImageInfo(imageId: string): StaticImageInfo | undefined {
        const imageMap = this.getSelectedImageMap();
        const info = imageMap.get(imageId);

        // 如果图片信息不存在，说明图片信息丢失了
        if (!info) {
            return undefined;
        }


        return info;
    }

    // 获取图片的静态文件路径
    public getImagePath(imageId: string): string | null {
        const imageInfo = this.getImageInfo(imageId);
        return imageInfo ? imageInfo.localPath : null;
    }

    // 打开本地图片文件
    public async openImageFile(imageId: string): Promise<void> {
        const imageInfo = this.getImageInfo(imageId);
        if (!imageInfo) {
            throw new Error('图片不存在');
        }

        try {
            // 直接打开静态文件路径
            window.open(imageInfo.localPath, '_blank');
        } catch (error) {
            console.error('打开图片文件失败:', error);
            throw new Error('无法打开图片文件');
        }
    }

    // 删除图片选择
    public deleteImageSelection(imageId: string): boolean {
        const imageMap = this.getSelectedImageMap();
        const success = imageMap.delete(imageId);
        if (success) {
            this.saveImageMap(imageMap);
        }
        return success;
    }

    // 获取所有已选择的图片信息
    public getAllSelectedImages(): StaticImageInfo[] {
        const imageMap = this.getSelectedImageMap();
        const images = Array.from(imageMap.values());
        return images;
    }

    // 批量导入图片选择
    public importImageSelections(images: StaticImageInfo[]): void {
        const imageMap = this.getSelectedImageMap();
        images.forEach(img => {
            if (img.id) {
                imageMap.set(img.id, img);
            }
        });
        this.saveImageMap(imageMap);
        // 成功导入图片信息到localStorage
    }

    // 清理未使用的图片选择
    public cleanupUnusedImageSelections(usedImageIds: string[]): void {
        const imageMap = this.getSelectedImageMap();
        const usedSet = new Set(usedImageIds);
        let deletedCount = 0;

        for (const [imageId] of imageMap) {
            if (!usedSet.has(imageId)) {
                imageMap.delete(imageId);
                deletedCount++;
            }
        }

        if (deletedCount > 0) {
            this.saveImageMap(imageMap);
            // 清理了未使用的图片选择
        }
    }

    // 获取存储统计信息
    public getSelectionStats(): { totalImages: number; totalSize: number } {
        const images = this.getAllSelectedImages();
        const totalSize = images.reduce((sum, img) => sum + (img.size || 0), 0);
        return {
            totalImages: images.length,
            totalSize
        };
    }

    // 获取图片预览URL（用于在应用中显示）
    public getImagePreviewUrl(imageId: string): string | null {
        const imageInfo = this.getImageInfo(imageId);
        if (!imageInfo) {
            return null;
        }

        // 直接返回静态文件路径
        return imageInfo.localPath;
    }

    // 检查图片是否存在
    public async checkImageExists(fileName: string): Promise<boolean> {
        try {
            const response = await fetch(`${this.IMAGE_DIR}${fileName}`, { method: 'HEAD' });
            return response.ok;
        } catch {
            return false;
        }
    }
}

// 导出单例实例
export const staticImageManager = StaticImageManager.getInstance(); 