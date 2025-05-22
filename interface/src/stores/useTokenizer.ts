import { create } from 'zustand';
import { PreTrainedTokenizer } from '@huggingface/transformers';
import { Token } from '@/types/tokenizer';
import { useModelStore } from './useModelStore';

interface TokenizerState {
    tokenizers: Map<string, PreTrainedTokenizer>;
    isTokenizerLoading: boolean;
    error: string | null;
    isLocalLoading: boolean;
    initializeTokenizer: (modelName: string) => Promise<void>;
    tokenizeText: (text: string | { role: string; content: string }[] | null) => Promise<Token[] | null>;
}

export const useTokenizer = create<TokenizerState>((set, get) => ({
    tokenizers: new Map(),
    isTokenizerLoading: true,
    error: null,
    isLocalLoading: false,

    initializeTokenizer: async (modelName: string) => {
        const { tokenizers } = get();
        
        // Don't initialize if modelName is empty
        if (!modelName) {
            set({ error: 'No model selected' });
            return;
        }
        
        // If tokenizer already exists for this model, just set it as active
        if (tokenizers.has(modelName)) {
            set({ isTokenizerLoading: false, error: null });
            return;
        }

        try {
            if (typeof window === 'undefined') return;
            set({ isTokenizerLoading: true, error: null });
            const tokenizer = await PreTrainedTokenizer.from_pretrained(modelName);
            
            // Add new tokenizer to the map
            const newTokenizers = new Map(tokenizers);
            newTokenizers.set(modelName, tokenizer);
            
            set({ 
                tokenizers: newTokenizers,
                isTokenizerLoading: false,
                error: null
            });
        } catch (err) {
            console.error('Error initializing tokenizer:', err);
            set({ 
                error: `Failed to initialize tokenizer for model ${modelName}`,
                isTokenizerLoading: false 
            });
        }
    },

    tokenizeText: async (text) => {
        const { tokenizers } = get();

        // print keys of tokenizers
        console.log(Array.from(tokenizers.keys()));

        const { modelName } = useModelStore.getState();
        const tokenizer = tokenizers.get(modelName);
        
        if (!tokenizer) {
            set({ error: 'No tokenizer available for current model' });
            return null;
        }

        try {
            set({ isLocalLoading: true, error: null });

            let textToTokenize: string | null = null;
            if (Array.isArray(text)) {
                // If text is an array of message objects, apply chat template
                const templateOutput = await tokenizer.apply_chat_template(text, { tokenize: false });
                textToTokenize = typeof templateOutput === 'string' ? templateOutput : null;
            } else {
                textToTokenize = text;
            }

            if (textToTokenize && textToTokenize.trim()) {
                if (typeof window !== 'undefined') {
                    const token_ids = await tokenizer.encode(textToTokenize, { add_special_tokens: false});
                    const tokens = token_ids.map((id) => tokenizer.decode([id]));

                    console.log(tokens, token_ids);

                    return tokens.map((token: string, index: number) => ({
                        id: token_ids[index],
                        text: token,
                        idx: index
                    }));
                }
            }
            return [];
        } catch (err) {
            console.error('Error tokenizing text:', err);
            set({ error: 'Failed to tokenize text' });
            return null;
        } finally {
            set({ isLocalLoading: false });
        }
    }
}));
