import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { apiKey } = await request.json();

        if (!apiKey) {
            return NextResponse.json(
                { success: false, message: 'API Key 未提供' },
                { status: 400 }
            );
        }

        // 调用DeepSeek API进行连接测试
        try {
            const fetchOptions: RequestInit = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: [
                        {
                            role: 'user',
                            content: '请回复"连接成功"'
                        }
                    ],
                    max_tokens: 10
                }),
                signal: AbortSignal.timeout(30000)
            };

            const response = await fetch(
                'https://api.deepseek.com/v1/chat/completions',
                fetchOptions
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error('DeepSeek API连接测试失败:', response.status, errorText);
                return NextResponse.json(
                    { success: false, message: `连接测试失败: ${response.status} - ${errorText}` },
                    { status: response.status }
                );
            }

            const data = await response.json();

            if (!data.choices || data.choices.length === 0) {
                return NextResponse.json(
                    { success: false, message: '连接测试响应异常' },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                message: '连接测试成功',
                response: data.choices[0].message.content
            });

        } catch (error) {
            console.error('DeepSeek API连接错误:', error);

            // 如果是网络连接错误，提供详细的错误信息
            if (error instanceof Error && error.name === 'AbortError') {
                return NextResponse.json(
                    { success: false, message: '连接超时，请检查网络连接' },
                    { status: 408 }
                );
            }

            return NextResponse.json(
                { success: false, message: `网络连接失败: ${error instanceof Error ? error.message : '未知错误'}` },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('DeepSeek连接测试API错误:', error);
        return NextResponse.json(
            { success: false, message: '服务器内部错误' },
            { status: 500 }
        );
    }
}
