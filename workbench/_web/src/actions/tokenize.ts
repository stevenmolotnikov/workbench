'use server'

import { PreTrainedTokenizer } from '@huggingface/transformers';
import type { Token } from '@/types/tokenizer';

// Module-level cache for tokenizers
const tokenizerCache = new Map<string, PreTrainedTokenizer>();

async function getTokenizer(modelName: string): Promise<PreTrainedTokenizer> {
  // Check if tokenizer is already cached
  if (tokenizerCache.has(modelName)) {
    return tokenizerCache.get(modelName)!;
  }

  // Load tokenizer and cache it
  console.log(`Loading tokenizer for model: ${modelName}`);

  if (modelName === "openai-community/gpt2") {
    console.log(`Using Xenova/gpt2 for model: ${modelName}`);
    modelName = "Xenova/gpt2";
  }

  const tokenizer = await PreTrainedTokenizer.from_pretrained(modelName);
  tokenizerCache.set(modelName, tokenizer);
  
  return tokenizer;
}

export async function isTokenizerCached(modelName: string): Promise<boolean> {
  return tokenizerCache.has(modelName);
}

export async function tokenizeText(
  text: string | null,
  modelName: string,
  addSpecialTokens = true
): Promise<Token[] | null> {
  try {
    if (!modelName) {
      throw new Error('No model specified');
    }

    if (!text) {
      return [];
    }

    const tokenizer = await getTokenizer(modelName);

    if (text.trim()) {
      const token_ids = tokenizer.encode(text, { add_special_tokens: addSpecialTokens });
      const tokens = token_ids.map((id) => tokenizer.decode([id]));

      return tokens.map((token: string, index: number) => ({
        id: token_ids[index],
        text: token,
        idx: index
      }));
    }

    return [];
  } catch (error) {
    console.error('Error tokenizing text:', error);
    throw new Error(`Failed to tokenize text: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function tokenizeChat(
  messages: { role: string; content: string }[],
  modelName: string,
  addSpecialTokens = true
): Promise<Token[] | null> {
  try {
    if (!modelName) {
      throw new Error('No model specified');
    }

    if (!messages || messages.length === 0) {
      return [];
    }

    const tokenizer = await getTokenizer(modelName);
    const templateOutput = await tokenizer.apply_chat_template(messages, { tokenize: false });
    
    if (typeof templateOutput !== 'string') {
      throw new Error('Chat template did not return a string');
    }

    return tokenizeText(templateOutput, modelName, addSpecialTokens);
  } catch (error) {
    console.error('Error tokenizing chat:', error);
    throw new Error(`Failed to tokenize chat: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function batchTokenizeText(
  texts: string[],
  modelName: string,
  addSpecialTokens = true
): Promise<(Token[] | null)[]> {
  try {
    if (!modelName) {
      throw new Error('No model specified');
    }

    if (!texts || texts.length === 0) {
      return [];
    }

    // Process all texts in parallel
    const tokenizationPromises = texts.map(text => 
      tokenizeText(text, modelName, addSpecialTokens)
    );

    return Promise.all(tokenizationPromises);
  } catch (error) {
    console.error('Error batch tokenizing texts:', error);
    throw new Error(`Failed to batch tokenize texts: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function clearTokenizerCache(): Promise<void> {
  tokenizerCache.clear();
  console.log('Tokenizer cache cleared');
}

export async function decodeTokenIds(
  tokenIds: number[],
  modelName: string
): Promise<string[]> {
  try {
    if (!modelName) {
      throw new Error('No model specified');
    }

    if (!tokenIds || tokenIds.length === 0) {
      return [];
    }

    // Get cached tokenizer or load if not cached
    const tokenizer = await getTokenizer(modelName);

    // Decode each token ID individually to get the string representation
    const decodedTokens = tokenIds.map((id) => tokenizer.decode([id]));

    return decodedTokens;
  } catch (error) {
    console.error('Error decoding token IDs:', error);
    throw new Error(`Failed to decode token IDs: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}