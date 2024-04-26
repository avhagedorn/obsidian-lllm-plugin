export const isValidAnthropicApiKey = (apiKey: string) => {
    return /^sk-ant-api\d{2}-[a-zA-Z0-9_-]{95}$/.test(apiKey);
};

export const isValidOpenAIKey = (apiKey: string) => {
    return /^sk-[a-zA-Z0-9]{32,}$/.test(apiKey);
};

export const isValidGeminiApiKey = (apiKey: string) => {
    return /^AIzaSy[A-Za-z0-9_-]{33}$/.test(apiKey);
}
