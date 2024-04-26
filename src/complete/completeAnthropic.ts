const completeAnthropic = async (
    systemPrompt: string, userPrompt: string, apiKey: string
): Promise<ReadableStream<Uint8Array>> => {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'anthropic-version': '2023-06-01',
            'anthropic-beta': 'messages-2023-12-15',
            'content-type': 'application/json',
            'x-api-key': apiKey,
        },
        body: JSON.stringify({
            model: 'claude-3-opus-20240229',
            max_tokens: 1024,
            stream: true,
            messages: [
                {
                    role: 'assistant',
                    content: systemPrompt,
                },
                {
                    role: 'user',
                    content: userPrompt,
                },
            ],
        }),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
        throw new Error('ReadableStream not yet supported in this browser');
    }

    return response.body;
};

export default completeAnthropic;
