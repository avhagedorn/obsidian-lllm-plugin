import OpenAI from "openai";

const completeOpenAI = async (
    systemPrompt: string, userPrompt: string, apiKey: string
) => {
    const openai = new OpenAI({ 
        apiKey,
        // This is required to use the plugin in the browser (Obsidian is an Electron app)
        dangerouslyAllowBrowser: true 
    });
    
    const stream = await openai.chat.completions.create({
        messages: [
            {"role": "system", "content": systemPrompt},
            {"role": "user", "content": userPrompt}],
        model: "gpt-4",
        stream: true
    });

    return stream.toReadableStream();
}

export default completeOpenAI;
