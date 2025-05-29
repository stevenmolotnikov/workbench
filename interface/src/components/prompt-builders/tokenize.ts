'use server'

import { PreTrainedTokenizer } from '@huggingface/transformers';
import { Token } from '@/types/tokenizer';

// Module-level cache for tokenizers
const tokenizerCache = new Map<string, PreTrainedTokenizer>();

async function getTokenizer(modelName: string): Promise<PreTrainedTokenizer> {
  // Check if tokenizer is already cached
  if (tokenizerCache.has(modelName)) {
    return tokenizerCache.get(modelName)!;
  }

  // Load tokenizer and cache it
  console.log(`Loading tokenizer for model: ${modelName}`);
  const tokenizer = await PreTrainedTokenizer.from_pretrained(modelName);
  tokenizerCache.set(modelName, tokenizer);
  
  return tokenizer;
}

export async function tokenizeText(
  text: string | { role: string; content: string }[] | null,
  modelName: string
): Promise<Token[] | null> {
  try {
    if (!modelName) {
      throw new Error('No model specified');
    }

    if (!text) {
      return [];
    }

    // Get cached tokenizer or load if not cached
    const tokenizer = await getTokenizer(modelName);

    let textToTokenize: string | null = null;
    
    if (Array.isArray(text)) {
      // If text is an array of message objects, apply chat template
      const templateOutput = await tokenizer.apply_chat_template(text, { tokenize: false });
      textToTokenize = typeof templateOutput === 'string' ? templateOutput : null;
    } else {
      textToTokenize = text;
    }

    if (textToTokenize && textToTokenize.trim()) {
      const token_ids = await tokenizer.encode(textToTokenize, { add_special_tokens: false });
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

export async function clearTokenizerCache(): Promise<void> {
  tokenizerCache.clear();
  console.log('Tokenizer cache cleared');
}