-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 如果存在旧的records表，重命名为exercise_records
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'records') THEN
        ALTER TABLE records RENAME TO exercise_records;
        RAISE NOTICE 'Successfully renamed table "records" to "exercise_records"';
    ELSE
        RAISE NOTICE 'Table "records" does not exist, skipping rename';
    END IF;
END $$;

-- 创建刷题记录表
CREATE TABLE IF NOT EXISTS exercise_records (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    module TEXT NOT NULL,
    total INTEGER NOT NULL,
    correct INTEGER NOT NULL,
    duration TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建学习计划表 (使用camelCase字段名)
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    module TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('题量', '正确率', '错题数')),
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    target INTEGER NOT NULL,
    progress INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT '未开始' CHECK (status IN ('未开始', '进行中', '已完成', '未达成')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建知识点表 (使用camelCase字段名)
CREATE TABLE IF NOT EXISTS knowledge (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    module TEXT NOT NULL,
    type TEXT NOT NULL,
    note TEXT NOT NULL,
    "imagePath" TEXT,
    "subCategory" TEXT,
    date DATE,
    source TEXT,
    idiom TEXT,
    meaning TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建用户设置表
CREATE TABLE IF NOT EXISTS user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_exercise_records_user_id ON exercise_records(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_records_date ON exercise_records(date);
CREATE INDEX IF NOT EXISTS idx_exercise_records_module ON exercise_records(module);

CREATE INDEX IF NOT EXISTS idx_plans_user_id ON plans(user_id);
CREATE INDEX IF NOT EXISTS idx_plans_status ON plans(status);
CREATE INDEX IF NOT EXISTS idx_plans_module ON plans(module);

CREATE INDEX IF NOT EXISTS idx_knowledge_user_id ON knowledge(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_module ON knowledge(module);
CREATE INDEX IF NOT EXISTS idx_knowledge_type ON knowledge(type);

-- 创建行级安全策略 (RLS)
ALTER TABLE exercise_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- 为exercise_records表创建策略
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'exercise_records' AND policyname = 'Users can view their own exercise_records') THEN
        CREATE POLICY "Users can view their own exercise_records" ON exercise_records
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'exercise_records' AND policyname = 'Users can insert their own exercise_records') THEN
        CREATE POLICY "Users can insert their own exercise_records" ON exercise_records
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'exercise_records' AND policyname = 'Users can update their own exercise_records') THEN
        CREATE POLICY "Users can update their own exercise_records" ON exercise_records
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'exercise_records' AND policyname = 'Users can delete their own exercise_records') THEN
        CREATE POLICY "Users can delete their own exercise_records" ON exercise_records
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- 为plans表创建策略
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'plans' AND policyname = 'Users can view their own plans') THEN
        CREATE POLICY "Users can view their own plans" ON plans
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'plans' AND policyname = 'Users can insert their own plans') THEN
        CREATE POLICY "Users can insert their own plans" ON plans
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'plans' AND policyname = 'Users can update their own plans') THEN
        CREATE POLICY "Users can update their own plans" ON plans
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'plans' AND policyname = 'Users can delete their own plans') THEN
        CREATE POLICY "Users can delete their own plans" ON plans
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- 为knowledge表创建策略
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'knowledge' AND policyname = 'Users can view their own knowledge') THEN
        CREATE POLICY "Users can view their own knowledge" ON knowledge
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'knowledge' AND policyname = 'Users can insert their own knowledge') THEN
        CREATE POLICY "Users can insert their own knowledge" ON knowledge
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'knowledge' AND policyname = 'Users can update their own knowledge') THEN
        CREATE POLICY "Users can update their own knowledge" ON knowledge
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'knowledge' AND policyname = 'Users can delete their own knowledge') THEN
        CREATE POLICY "Users can delete their own knowledge" ON knowledge
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- 为user_settings表创建策略
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can view their own settings') THEN
        CREATE POLICY "Users can view their own settings" ON user_settings
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can insert their own settings') THEN
        CREATE POLICY "Users can insert their own settings" ON user_settings
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can update their own settings') THEN
        CREATE POLICY "Users can update their own settings" ON user_settings
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can delete their own settings') THEN
        CREATE POLICY "Users can delete their own settings" ON user_settings
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- 创建更新时间的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为所有表添加更新时间触发器
DROP TRIGGER IF EXISTS update_exercise_records_updated_at ON exercise_records;
CREATE TRIGGER update_exercise_records_updated_at BEFORE UPDATE ON exercise_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_plans_updated_at ON plans;
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_knowledge_updated_at ON knowledge;
CREATE TRIGGER update_knowledge_updated_at BEFORE UPDATE ON knowledge
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 