import { create } from 'zustand';
import type { Model, Token } from '@/types/models';

interface LensWorkspaceState {
    tokenData: Token[];
    setTokenData: (tokenData: Token[]) => void;
}

export const useLensWorkspace = create<LensWorkspaceState>()((set) => ({
    tokenData: [],
    setTokenData: (tokenData: Token[]) => set({ tokenData }),
}));