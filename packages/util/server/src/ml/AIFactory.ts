import { createOpenAI, openai } from "@ai-sdk/openai";
import { anthropic, createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

/**
 * Interface for AI providers
 */
export interface IAIProvider {
    /**
     * Create a language model instance with the given model ID
     */
    createModel(modelId: string): any; // Using any to avoid version conflicts between providers

    /**
     * Native tools available for this provider
     */
    tools: {
        web_search?: any;
    };
}

/**
 * OpenAI provider implementation
 */
class OpenAIProvider implements IAIProvider {
    private instance = createOpenAI({
        apiKey: process.env.OPENAI_API_KEY || "selfhost-invalid-placeholder",
        baseURL: process.env.OPENAI_API_BASE_URL || undefined,
    });

    createModel(modelId: string): any {
        return this.instance(modelId);
    }

    get tools() {
        return {
            web_search: openai.tools.webSearch({
                searchContextSize: "high",
            }),
        };
    }
}

/**
 * Anthropic provider implementation
 */
class AnthropicProvider implements IAIProvider {
    private instance = createAnthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
    });

    createModel(modelId: string): any {
        return this.instance(modelId);
    }

    get tools() {
        return {
            web_search: anthropic.tools.webSearch_20250305({
                maxUses: 3,
            }),
        };
    }
}

/**
 * Google Gemini provider implementation
 */
class GeminiProvider implements IAIProvider {
    private instance = createGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });

    createModel(modelId: string): any {
        return this.instance(modelId);
    }

    get tools() {
        return {
            get web_search() {
                throw new Error("Google provider does not support web_search tool yet");
            },
        };
    }
}

/**
 * Factory class for creating AI providers
 */
export class AIFactory {
    /**
     * Get an AI provider instance based on the provider name
     */
    static getProvider(providerName: string): IAIProvider {
        switch (providerName) {
            case "openai":
                return new OpenAIProvider();
            case "anthropic":
                return new AnthropicProvider();
            case "google":
                return new GeminiProvider();
            default:
                throw new Error(`Unsupported AI provider: ${providerName}`);
        }
    }
}

/**
 * Get the AI provider based on environment configuration
 */
export const getAIProvider = (): IAIProvider => {
    return AIFactory.getProvider(process.env.AI_PROVIDER || "openai");
};
