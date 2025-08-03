-- 专门用于将records表重命名为exercise_records的迁移脚本
-- 这个脚本会安全地处理表重命名，避免冲突

-- 检查并重命名表
DO $$ 
DECLARE
    table_exists BOOLEAN;
    new_table_exists BOOLEAN;
BEGIN
    -- 检查旧的records表是否存在
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'records'
    ) INTO table_exists;
    
    -- 检查新的exercise_records表是否存在
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'exercise_records'
    ) INTO new_table_exists;
    
    -- 如果旧表存在且新表不存在，则重命名
    IF table_exists AND NOT new_table_exists THEN
        ALTER TABLE records RENAME TO exercise_records;
        RAISE NOTICE 'Successfully renamed table "records" to "exercise_records"';
    ELSIF table_exists AND new_table_exists THEN
        RAISE NOTICE 'Both "records" and "exercise_records" tables exist. Please manually handle the migration.';
    ELSIF NOT table_exists AND new_table_exists THEN
        RAISE NOTICE 'Table "exercise_records" already exists, no rename needed.';
    ELSE
        RAISE NOTICE 'Neither "records" nor "exercise_records" table exists.';
    END IF;
END $$;

-- 如果records表仍然存在，删除它（只有在exercise_records表存在的情况下）
DO $$ 
DECLARE
    old_table_exists BOOLEAN;
    new_table_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'records'
    ) INTO old_table_exists;
    
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'exercise_records'
    ) INTO new_table_exists;
    
    IF old_table_exists AND new_table_exists THEN
        DROP TABLE records;
        RAISE NOTICE 'Dropped old "records" table as "exercise_records" already exists';
    END IF;
END $$; 