import { ChatCompletionChunk } from "openai/resources/chat/completions";
import { MessageDeltaEvent, MessageStreamEvent } from "@anthropic-ai/sdk/resources";
import { completionPrompt } from "../constants";
import completeOpenAI from "./completeOpenAI";
import completeAnthropic from "./completeAnthropic";
import { LLMProvider } from "main";
import completeGemini from "./completeGemini";


class LLMResponseStream extends TransformStream {
    constructor() {
        const textDecoder = new TextDecoder();

        super({
            start() {},
            async transform(chunk, controller) {

                if (typeof chunk === 'string') {
                    controller.enqueue(chunk);
                    return;
                }

                else if (chunk instanceof ArrayBuffer) {
                    const decodedText = textDecoder.decode(chunk);
                    const decodedJson = JSON.parse(decodedText);

                    // OpenAI Response
                    if (decodedJson.hasOwnProperty('choices')) {
                        const data = decodedJson as ChatCompletionChunk;
                        controller.enqueue(data.choices[0]?.delta?.content || '');
                    } 
                    
                    // Anthropic Response
                    else if (decodedJson.hasOwnProperty('type')) {
                        const data = decodedJson as MessageStreamEvent;
                        if (data.type === "message_delta") {
                            const deltaData = data as MessageDeltaEvent;
                            controller.enqueue(deltaData.delta.stop_sequence);
                        }
                    }
                }
            },
        });
    }
}


export const completeFactory = async (
    selectedText: string, 
    llmProvider: LLMProvider,
    apiKey: string,
) => {
    let response;
    if (llmProvider === 'OpenAI') {
        response = await completeOpenAI(
            completionPrompt, 
            selectedText, 
            apiKey
        );
    } else if (llmProvider === 'Anthropic') {
        response = await completeAnthropic(
            completionPrompt, 
            selectedText, 
            apiKey
        );
    } else if (llmProvider === 'Gemini') {
        response = completeGemini(
            completionPrompt, 
            selectedText, 
            apiKey
        );
    } else {
        throw new Error('Invalid LLM provider');
    }

    const transformer = new LLMResponseStream();
    response.pipeThrough(transformer);
    return transformer.readable.getReader();
}
