"use server";

import type { Token } from "@/types/models";
import { PreTrainedTokenizer } from "@huggingface/transformers";

// Module-level cache for tokenizers by model name
const tokenizerCache = new Map<string, PreTrainedTokenizer>();

async function getTokenizer(modelName: string): Promise<PreTrainedTokenizer> {
    const cached = tokenizerCache.get(modelName);
    if (cached) return cached;

    const tokenizer = await PreTrainedTokenizer.from_pretrained(modelName);
    tokenizerCache.set(modelName, tokenizer);
    return tokenizer;
}

interface DecodeResponse {
    text: string;
}

interface BatchDecodeResponse {
    texts: string[];
}

export async function encodeText(
    text: string,
    model: string,
    addSpecialTokens: boolean = true
): Promise<Token[]> {
    try {
        if (!model) throw new Error("No model specified");
        if (!text || !text.trim()) return [];

        const tokenizer = await getTokenizer(model);
        const tokenIds = await Promise.resolve(
            tokenizer.encode(text, { add_special_tokens: addSpecialTokens }) as unknown as Promise<number[]> | number[]
        );
        const ids = Array.isArray(tokenIds) ? tokenIds : await tokenIds;

        const tokens: Token[] = ids.map((id, index) => ({
            id,
            text: tokenizer.decode([id]),
            idx: index,
            targetIds: [],
        }));

        return tokens;
    } catch (error) {
        // Mirror tokenize.ts behavior: return [] on failure
        return [];
    }
}

export async function decodeText(
    tokenIds: number[],
    model: string,
    batch: boolean = false
): Promise<DecodeResponse | BatchDecodeResponse> {
    try {
        if (!model) throw new Error("No model specified");
        if (!tokenIds || tokenIds.length === 0) {
            return batch ? { texts: [] } : { text: "" };
        }

        const tokenizer = await getTokenizer(model);

        if (batch) {
            const texts = tokenIds.map((id) => tokenizer.decode([id]));
            return { texts };
        }

        const text = tokenizer.decode(tokenIds);
        return { text };
    } catch (error) {
        // Mirror tokenize.ts behavior: return empty structure on failure
        return batch ? { texts: [] } : { text: "" };
    }
}

export async function isTokenizerCached(modelName: string): Promise<boolean> {
    return tokenizerCache.has(modelName);
}

export async function clearTokenizerCache(): Promise<void> {
    tokenizerCache.clear();
}


