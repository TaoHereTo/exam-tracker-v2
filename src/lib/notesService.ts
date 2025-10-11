import { supabase } from '@/supabaseClient';
import { useNotification } from '@/components/magicui/NotificationProvider';

// 笔记数据类型
export interface Note {
    id: string;
    user_id: string;
    title: string;
    content: string;
    tags: string[];
    is_favorite: boolean;
    is_archived: boolean;
    created_at: string;
    updated_at: string;
}

export interface NoteTag {
    id: string;
    user_id: string;
    name: string;
    color: string;
    created_at: string;
}

export interface NoteAttachment {
    id: string;
    note_id: string;
    user_id: string;
    file_name: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    created_at: string;
}

export interface NoteVersion {
    id: string;
    note_id: string;
    user_id: string;
    title: string;
    content: string;
    version_number: number;
    created_at: string;
}

export interface NotesStats {
    total_notes: number;
    favorite_notes: number;
    archived_notes: number;
    total_tags: number;
    recent_notes: number;
}

export interface SearchNotesParams {
    search_query?: string;
    tag_filter?: string;
    favorite_only?: boolean;
    archived_only?: boolean;
    limit?: number;
    offset?: number;
}

class NotesService {
    private supabase = supabase;

    // 获取当前用户ID
    private async getCurrentUserId(): Promise<string> {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user) {
            throw new Error('用户未登录');
        }
        return user.id;
    }

    // 获取所有笔记
    async getNotes(params: SearchNotesParams = {}): Promise<Note[]> {
        try {
            const userId = await this.getCurrentUserId();

            // 首先尝试直接查询notes表，而不是使用可能不存在的RPC函数
            const { data, error } = await this.supabase
                .from('notes')
                .select('*')
                .eq('user_id', userId)
                .eq('is_archived', false)
                .order('updated_at', { ascending: false })
                .limit(params.limit || 50);

            if (error) {
                console.error('获取笔记失败:', error);
                // 如果是表不存在的错误，返回空数组
                if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
                    return [];
                }
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('获取笔记失败:', error);
            // 对于新用户或数据库未初始化的情况，返回空数组而不是抛出错误
            if (error instanceof Error && (
                error.message.includes('relation') ||
                error.message.includes('does not exist') ||
                error.message.includes('permission') ||
                error.message.includes('auth')
            )) {
                return [];
            }
            throw error;
        }
    }

    // 根据ID获取单个笔记
    async getNoteById(id: string): Promise<Note | null> {
        try {
            const userId = await this.getCurrentUserId();

            const { data, error } = await this.supabase
                .from('notes')
                .select('*')
                .eq('id', id)
                .eq('user_id', userId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return null; // 笔记不存在
                }
                console.error('获取笔记失败:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('获取笔记失败:', error);
            throw error;
        }
    }

    // 创建新笔记
    async createNote(note: Omit<Note, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Note> {
        try {
            const userId = await this.getCurrentUserId();

            const { data, error } = await this.supabase
                .from('notes')
                .insert({
                    user_id: userId,
                    title: note.title,
                    content: note.content,
                    tags: note.tags,
                    is_favorite: note.is_favorite,
                    is_archived: note.is_archived
                })
                .select()
                .single();

            if (error) {
                console.error('创建笔记失败:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('创建笔记失败:', error);
            throw error;
        }
    }

    // 更新笔记
    async updateNote(id: string, updates: Partial<Omit<Note, 'id' | 'user_id' | 'created_at'>>): Promise<Note> {
        try {
            const userId = await this.getCurrentUserId();

            // 先保存当前版本到历史记录
            const currentNote = await this.getNoteById(id);
            if (currentNote) {
                await this.saveNoteVersion(id, currentNote.title, currentNote.content);
            }

            const { data, error } = await this.supabase
                .from('notes')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .eq('user_id', userId)
                .select()
                .single();

            if (error) {
                console.error('更新笔记失败:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('更新笔记失败:', error);
            throw error;
        }
    }

    // 删除笔记
    async deleteNote(id: string): Promise<void> {
        try {
            const userId = await this.getCurrentUserId();

            const { error } = await this.supabase
                .from('notes')
                .delete()
                .eq('id', id)
                .eq('user_id', userId);

            if (error) {
                console.error('删除笔记失败:', error);
                throw error;
            }
        } catch (error) {
            console.error('删除笔记失败:', error);
            throw error;
        }
    }

    // 获取笔记标签
    async getNoteTags(): Promise<NoteTag[]> {
        try {
            const userId = await this.getCurrentUserId();

            const { data, error } = await this.supabase
                .from('note_tags')
                .select('*')
                .eq('user_id', userId)
                .order('name');

            if (error) {
                console.error('获取标签失败:', error);
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('获取标签失败:', error);
            throw error;
        }
    }

    // 创建新标签
    async createNoteTag(tag: Omit<NoteTag, 'id' | 'user_id' | 'created_at'>): Promise<NoteTag> {
        try {
            const userId = await this.getCurrentUserId();

            const { data, error } = await this.supabase
                .from('note_tags')
                .insert({
                    user_id: userId,
                    name: tag.name,
                    color: tag.color
                })
                .select()
                .single();

            if (error) {
                console.error('创建标签失败:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('创建标签失败:', error);
            throw error;
        }
    }

    // 删除标签
    async deleteNoteTag(id: string): Promise<void> {
        try {
            const userId = await this.getCurrentUserId();

            const { error } = await this.supabase
                .from('note_tags')
                .delete()
                .eq('id', id)
                .eq('user_id', userId);

            if (error) {
                console.error('删除标签失败:', error);
                throw error;
            }
        } catch (error) {
            console.error('删除标签失败:', error);
            throw error;
        }
    }

    // 获取笔记统计信息
    async getNotesStats(): Promise<NotesStats> {
        try {
            const userId = await this.getCurrentUserId();

            const { data, error } = await this.supabase
                .rpc('get_user_notes_stats', {
                    user_uuid: userId
                });

            if (error) {
                console.error('获取统计信息失败:', error);
                throw error;
            }

            return data[0] || {
                total_notes: 0,
                favorite_notes: 0,
                archived_notes: 0,
                total_tags: 0,
                recent_notes: 0
            };
        } catch (error) {
            console.error('获取统计信息失败:', error);
            throw error;
        }
    }

    // 保存笔记版本
    async saveNoteVersion(noteId: string, title: string, content: string): Promise<string> {
        try {
            const userId = await this.getCurrentUserId();

            const { data, error } = await this.supabase
                .rpc('save_note_version', {
                    note_uuid: noteId,
                    user_uuid: userId,
                    note_title: title,
                    note_content: content
                });

            if (error) {
                console.error('保存笔记版本失败:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('保存笔记版本失败:', error);
            throw error;
        }
    }

    // 获取笔记版本历史
    async getNoteVersions(noteId: string): Promise<NoteVersion[]> {
        try {
            const userId = await this.getCurrentUserId();

            const { data, error } = await this.supabase
                .from('note_versions')
                .select('*')
                .eq('note_id', noteId)
                .eq('user_id', userId)
                .order('version_number', { ascending: false });

            if (error) {
                console.error('获取笔记版本失败:', error);
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('获取笔记版本失败:', error);
            throw error;
        }
    }

    // 恢复笔记到指定版本
    async restoreNoteToVersion(noteId: string, versionId: string): Promise<Note> {
        try {
            const userId = await this.getCurrentUserId();

            // 获取版本信息
            const { data: version, error: versionError } = await this.supabase
                .from('note_versions')
                .select('*')
                .eq('id', versionId)
                .eq('note_id', noteId)
                .eq('user_id', userId)
                .single();

            if (versionError) {
                console.error('获取版本信息失败:', versionError);
                throw versionError;
            }

            // 更新笔记内容
            const { data, error } = await this.supabase
                .from('notes')
                .update({
                    title: version.title,
                    content: version.content,
                    updated_at: new Date().toISOString()
                })
                .eq('id', noteId)
                .eq('user_id', userId)
                .select()
                .single();

            if (error) {
                console.error('恢复笔记失败:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('恢复笔记失败:', error);
            throw error;
        }
    }

    // 导出笔记为JSON
    async exportNotes(notes: Note[]): Promise<string> {
        const exportData = {
            export_date: new Date().toISOString(),
            version: '1.0',
            notes: notes.map(note => ({
                title: note.title,
                content: note.content,
                tags: note.tags,
                is_favorite: note.is_favorite,
                is_archived: note.is_archived,
                created_at: note.created_at,
                updated_at: note.updated_at
            }))
        };

        return JSON.stringify(exportData, null, 2);
    }

    // 导入笔记
    async importNotes(jsonData: string): Promise<{ success: number; failed: number }> {
        try {
            const importData = JSON.parse(jsonData);
            const notes = importData.notes || [];

            let success = 0;
            let failed = 0;

            for (const noteData of notes) {
                try {
                    await this.createNote({
                        title: noteData.title,
                        content: noteData.content,
                        tags: noteData.tags || [],
                        is_favorite: noteData.is_favorite || false,
                        is_archived: noteData.is_archived || false
                    });
                    success++;
                } catch (error) {
                    console.error('导入笔记失败:', error);
                    failed++;
                }
            }

            return { success, failed };
        } catch (error) {
            console.error('解析导入数据失败:', error);
            throw new Error('导入数据格式错误');
        }
    }

    // 批量操作
    async batchUpdateNotes(updates: Array<{ id: string; updates: Partial<Note> }>): Promise<void> {
        try {
            const userId = await this.getCurrentUserId();

            for (const { id, updates: noteUpdates } of updates) {
                await this.supabase
                    .from('notes')
                    .update(noteUpdates)
                    .eq('id', id)
                    .eq('user_id', userId);
            }
        } catch (error) {
            console.error('批量更新失败:', error);
            throw error;
        }
    }

    // 批量删除笔记
    async batchDeleteNotes(ids: string[]): Promise<void> {
        try {
            const userId = await this.getCurrentUserId();

            const { error } = await this.supabase
                .from('notes')
                .delete()
                .in('id', ids)
                .eq('user_id', userId);

            if (error) {
                console.error('批量删除失败:', error);
                throw error;
            }
        } catch (error) {
            console.error('批量删除失败:', error);
            throw error;
        }
    }
}

// 创建单例实例
export const notesService = new NotesService();
