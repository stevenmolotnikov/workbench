'use server'

import type { Token } from '@/types/tokenizer';
import config from '@/lib/config';

export async function isTokenizerCached(modelName: string): Promise<boolean> {
  // Since caching is now handled by the backend, always return true
  return true;
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

    if (!text.trim()) {
      return [];
    }

    const response = await fetch(config.getApiUrl(config.endpoints.tokenize), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: [text],
        model: modelName,
        add_special_tokens: addSpecialTokens,
        operation: 'tokenize',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }

    return result.tokens;
  } catch (error) {
    console.error('Error tokenizing text:', error);
    throw new Error(`Failed to tokenize text: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

    // Filter out empty texts but remember their positions
    const nonEmptyTexts = texts.filter(text => text && text.trim());
    
    if (nonEmptyTexts.length === 0) {
      return texts.map(() => []);
    }

    const response = await fetch(config.getApiUrl(config.endpoints.tokenize), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: nonEmptyTexts,
        model: modelName,
        add_special_tokens: addSpecialTokens,
        operation: 'tokenize',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }

    // Map results back to original positions
    let resultIndex = 0;
    const results = texts.map(text => {
      if (!text || !text.trim()) {
        return [];
      }
      return result.results[resultIndex++].tokens;
    });

    return results;
  } catch (error) {
    console.error('Error batch tokenizing texts:', error);
    throw new Error(`Failed to batch tokenize texts: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
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

    const response = await fetch(config.getApiUrl(config.endpoints.tokenize), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        operation: 'decode',
        token_ids: tokenIds,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }

    return result.decoded_tokens;
  } catch (error) {
    console.error('Error decoding token IDs:', error);
    throw new Error(`Failed to decode token IDs: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}