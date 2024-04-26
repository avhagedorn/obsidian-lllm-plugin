import { GoogleGenerativeAI } from "@google/generative-ai"

const completeGeminiGenerator = async function* (
    systemPrompt: string, userPrompt: string, apiKey: string
) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro"}) 

    const response = await model.generateContentStream(`System: ${systemPrompt}\nUser: ${userPrompt}`);
    for await (const chunk of response.stream) {
        yield chunk.text();
    }
}

const completeGemini = (
    systemPrompt: string, userPrompt: string, apiKey: string
): ReadableStream<string> => {
    const generator = completeGeminiGenerator(systemPrompt, userPrompt, apiKey);
    return new ReadableStream({
        async start(controller) {
            for await (const chunk of generator) {
                controller.enqueue(chunk);
            }
            controller.close();
        },
    });
};

export default completeGemini;
