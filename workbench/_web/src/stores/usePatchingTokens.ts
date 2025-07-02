import { create } from 'zustand';
import type { Token } from '@/types/tokenizer';

interface PatchingTokensState {
  // Token data
  sourceTokenData: Token[] | null;
  destinationTokenData: Token[] | null;
  hoveredTokenIdx: number | null;

  // Highlighted tokens
  highlightedSourceTokens: number[];
  highlightedDestinationTokens: number[];
  
  // Actions
  setHoveredTokenIdx: (idx: number | null) => void;
  setSourceTokenData: (tokens: Token[] | null) => void;
  setDestinationTokenData: (tokens: Token[] | null) => void;
  setHighlightedSourceTokens: (tokens: number[]) => void;
  setHighlightedDestinationTokens: (tokens: number[]) => void;
  clearHighlightedTokens: () => void;
}

export const usePatchingTokens = create<PatchingTokensState>((set) => ({
  // Initial state
  sourceTokenData: null,
  destinationTokenData: null,
  hoveredTokenIdx: null,

  // Highlighted tokens
  highlightedSourceTokens: [],
  highlightedDestinationTokens: [],
  
  // Actions
  setHoveredTokenIdx: (idx) => set({ hoveredTokenIdx: idx }),
  setSourceTokenData: (tokens) => set({ sourceTokenData: tokens }),
  setDestinationTokenData: (tokens) => set({ destinationTokenData: tokens }),
  setHighlightedSourceTokens: (tokens) => set({ highlightedSourceTokens: tokens }),
  setHighlightedDestinationTokens: (tokens) => set({ highlightedDestinationTokens: tokens }),
  clearHighlightedTokens: () => set({ 
    highlightedSourceTokens: [],
    highlightedDestinationTokens: []
  }),
}));