"use client";

import React, { createContext, useContext, useState } from "react";
import type { Token } from "@/types/models";

interface PatchState {
    // Text prompts
    sourceText: string;
    destText: string;

    sourceTokenData: Token[];
    destTokenData: Token[];

    // Edit mode
    isEditing: boolean;
}       

interface PatchActions {
    setSourceText: (text: string) => void;
    setDestText: (text: string) => void;
    setSourceTokenData: (tokenData: Token[]) => void;
    setDestTokenData: (tokenData: Token[]) => void;
    setIsEditing: (isEditing: boolean) => void;
}

const PatchContext = createContext<PatchState & PatchActions | null>(null);

export function usePatch(): PatchState & PatchActions {
    const ctx = useContext(PatchContext);
    if (!ctx) throw new Error("usePatch must be used within PatchProvider");
    return ctx;
}

export default function PatchProvider({ children }: { children: React.ReactNode }) {
    // Text
    const [sourceText, setSourceText] = useState("");
    const [destText, setDestText] = useState("");

    // Tokens
    const [sourceTokenData, setSourceTokenData] = useState<Token[]>([]);
    const [destTokenData, setDestTokenData] = useState<Token[]>([]);

    // Edit view
    const [isEditing, setIsEditing] = useState(true);

    const value = {
        sourceText,
        destText,
        isEditing,
        sourceTokenData,
        destTokenData,

        setSourceText,
        setDestText,
        setSourceTokenData,
        setDestTokenData,
        setIsEditing,
    };

    return (
        <PatchContext.Provider value={value}>
            {children}
        </PatchContext.Provider>
    );
}