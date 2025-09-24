import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { apiKey, model, prompt } = await request.json();

        if (!apiKey) {
            return NextResponse.json(
                { success: false, message: 'API Key 未提供' },
                { status: 400 }
            );
        }

        if (!prompt) {
            return NextResponse.json(
                { success: false, message: '分析提示未提供' },
                { status: 400 }
            );
        }

        // 根据模型选择不同的API端点
        const selectedModel = model || 'gemini-2.5-flash';

        if (selectedModel.startsWith('deepseek')) {
            // 调用DeepSeek API进行分析
            try {
                const fetchOptions: RequestInit = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: selectedModel || 'deepseek-chat',
                        messages: [
                            {
                                role: 'user',
                                content: prompt
                            }
                        ],
                        max_tokens: 2000,
                        temperature: 0.7
                    }),
                    signal: AbortSignal.timeout(60000)
                };

                const response = await fetch(
                    'https://api.deepseek.com/v1/chat/completions',
                    fetchOptions
                );

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('DeepSeek API错误:', response.status, errorText);
                    return NextResponse.json(
                        { success: false, message: `DeepSeek API请求失败: ${response.status} - ${errorText}` },
                        { status: response.status }
                    );
                }

                const data = await response.json();

                if (!data.choices || data.choices.length === 0) {
                    return NextResponse.json(
                        { success: false, message: 'AI分析结果为空' },
                        { status: 500 }
                    );
                }

                const analysisText = data.choices[0].message.content;

                return NextResponse.json({
                    success: true,
                    analysisText: analysisText
                });

            } catch (error) {
                console.error('DeepSeek API分析错误:', error);

                // 如果是网络连接错误，提供详细的错误信息
                if (error instanceof Error && error.name === 'AbortError') {
                    return NextResponse.json(
                        { success: false, message: '分析超时，请检查网络连接' },
                        { status: 408 }
                    );
                }

                return NextResponse.json(
                    { success: false, message: `网络连接失败: ${error instanceof Error ? error.message : '未知错误'}` },
                    { status: 500 }
                );
            }
        }

        // 调用Gemini API
        try {
            const fetchOptions: RequestInit = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                }),
                signal: AbortSignal.timeout(60000)
            };

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`,
                fetchOptions
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Gemini API错误:', response.status, errorText);
                return NextResponse.json(
                    { success: false, message: `Gemini API请求失败: ${response.status} - ${errorText}` },
                    { status: response.status }
                );
            }

            const data = await response.json();

            if (!data.candidates || data.candidates.length === 0) {
                return NextResponse.json(
                    { success: false, message: 'AI分析结果为空' },
                    { status: 500 }
                );
            }

            const analysisText = data.candidates[0].content.parts[0].text;

            return NextResponse.json({
                success: true,
                analysisText: analysisText
            });

        } catch (error) {
            console.error('Gemini API分析错误:', error);

            // 如果是网络连接错误，提供详细的错误信息
            if (error instanceof Error && error.name === 'AbortError') {
                return NextResponse.json(
                    { success: false, message: '分析超时，请检查网络连接或使用代理' },
                    { status: 408 }
                );
            }

            return NextResponse.json(
                { success: false, message: `网络连接失败: ${error instanceof Error ? error.message : '未知错误'}` },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('AI分析API错误:', error);
        return NextResponse.json(
            { success: false, message: '服务器内部错误' },
            { status: 500 }
        );
    }
}
