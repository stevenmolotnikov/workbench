import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, modelName, addSpecialTokens = true, operation = 'tokenize' } = body;

    if (!modelName) {
      return NextResponse.json({ error: 'No model specified' }, { status: 400 });
    }

    const tokenizer = await getTokenizer(modelName);

    switch (operation) {
      case 'tokenize':
        if (!text) {
          return NextResponse.json({ tokens: [] });
        }

        if (text.trim()) {
          const token_ids = tokenizer.encode(text, { add_special_tokens: addSpecialTokens });
          const tokens = token_ids.map((id) => tokenizer.decode([id]));

          const result = tokens.map((token: string, index: number) => ({
            id: token_ids[index],
            text: token,
            idx: index
          }));

          return NextResponse.json({ tokens: result });
        }

        return NextResponse.json({ tokens: [] });

      case 'batch_tokenize':
        const { texts } = body;
        if (!texts || texts.length === 0) {
          return NextResponse.json({ results: [] });
        }

        const tokenizationPromises = texts.map(async (text: string) => {
          if (!text) return [];
          
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
        });

        const results = await Promise.all(tokenizationPromises);
        return NextResponse.json({ results });

      case 'decode':
        const { tokenIds } = body;
        if (!tokenIds || tokenIds.length === 0) {
          return NextResponse.json({ decodedTokens: [] });
        }

        const decodedTokens = tokenIds.map((id: number) => tokenizer.decode([id]));
        return NextResponse.json({ decodedTokens });

      case 'check_cache':
        const isCached = tokenizerCache.has(modelName);
        return NextResponse.json({ isCached });

      default:
        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in tokenization API:', error);
    return NextResponse.json(
      { error: `Failed to process request: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 