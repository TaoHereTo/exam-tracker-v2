# Supabase 邮箱验证码设置指南

## 问题描述
当前Supabase默认发送的是登录链接而不是6位数字验证码。

## 解决方案
需要在Supabase控制台中配置自定义的邮件模板，将登录链接替换为6位数字验证码。

## 配置步骤

### 1. 登录Supabase控制台
1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目

### 2. 进入认证设置
1. 在左侧菜单中点击 **Authentication**
2. 点击 **Email Templates**

### 3. 配置邮件模板
找到 **Confirm signup** 模板，点击编辑。

### 4. 修改邮件模板内容

将默认的邮件模板替换为以下内容：

**Subject (邮件主题):**
```
确认您的邮箱验证码
```

**Message (邮件内容):**
```html
<h2>欢迎注册行测记录应用</h2>

<p>您的邮箱验证码是：</p>

<h1 style="font-size: 32px; font-weight: bold; color: #2563eb; text-align: center; padding: 20px; border: 2px solid #e5e7eb; border-radius: 8px; background-color: #f9fafb;">
  {{ .Token }}
</h1>

<p>验证码将在10分钟后过期。</p>

<p>如果这不是您的操作，请忽略此邮件。</p>

<p>感谢您使用我们的应用！</p>
```

### 5. 配置登录邮件模板
找到 **Invite user** 或 **Magic Link** 模板（用于邮箱验证码登录），同样进行配置：

**Subject (邮件主题):**
```
您的登录验证码
```

**Message (邮件内容):**
```html
<h2>邮箱验证码登录</h2>

<p>您的登录验证码是：</p>

<h1 style="font-size: 32px; font-weight: bold; color: #2563eb; text-align: center; padding: 20px; border: 2px solid #e5e7eb; border-radius: 8px; background-color: #f9fafb;">
  {{ .Token }}
</h1>

<p>验证码将在10分钟后过期。</p>

<p>如果这不是您的操作，请忽略此邮件。</p>
```

### 6. 保存配置
1. 点击 **Save** 保存模板
2. 确保模板已启用

## 技术说明

### 模板变量
- `{{ .Token }}` - 这是6位数字验证码
- `{{ .ConfirmationURL }}` - 这是原来的登录链接（我们不需要使用）

### 邮件模板要求
1. 验证码显示要清晰可见（使用了大的字体和边框）
2. 包含过期时间提醒（10分钟）
3. 包含安全提醒

## 测试配置

配置完成后，可以通过以下方式测试：

1. 在应用中尝试注册新账号
2. 检查收到的邮件是否显示6位数字验证码而不是登录链接

## 故障排除

### 如果仍然收到登录链接：
1. 检查是否保存了模板修改
2. 确认使用的是正确的API调用（`signInWithOtp` 而不是 `signInWithPassword`）
3. 检查Supabase项目设置

### 如果验证码邮件没有收到：
1. 检查邮箱地址是否正确
2. 检查垃圾邮件文件夹
3. 确认Supabase邮件服务配置正确

## 安全注意事项

1. 验证码具有时效性（通常10分钟）
2. 每个验证码只能使用一次
3. 建议在生产环境中启用速率限制
4. 定期轮换邮件模板以防止被滥用

## 相关代码位置

- 注册验证码发送：`src/components/auth/SignUpForm.tsx`
- 登录验证码发送：`src/components/auth/LoginForm.tsx`
- 验证码验证：`src/components/auth/EmailVerificationForm.tsx`
- 验证码输入组件：`src/components/ui/OTPInput.tsx`
