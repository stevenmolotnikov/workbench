'use server'

import type { Token } from '@/types/tokenizer';

export async function isTokenizerCached(modelName: string): Promise<boolean> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/tokenize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'check_cache',
        modelName,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.isCached;
  } catch (error) {
    console.error('Error checking tokenizer cache:', error);
    return false;
  }
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

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/tokenize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'tokenize',
        text,
        modelName,
        addSpecialTokens,
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

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/tokenize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'batch_tokenize',
        texts,
        modelName,
        addSpecialTokens,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }

    return result.results;
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

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/tokenize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'decode',
        tokenIds,
        modelName,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }

    return result.decodedTokens;
  } catch (error) {
    console.error('Error decoding token IDs:', error);
    throw new Error(`Failed to decode token IDs: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}