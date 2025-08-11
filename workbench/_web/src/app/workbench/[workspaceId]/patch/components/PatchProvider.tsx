"use client";

import React, { createContext, useContext, useState } from "react";
import type { Token } from "@/types/models";


export type PatchMainMode = "edit" | "connect" | "align";
export type PatchSubMode = "loop" | "ablate";

interface PatchState {
    // Text prompts
    sourceText: string;
    destText: string;

    sourceTokenData: Token[];
    destTokenData: Token[];

    // Mode
    mainMode: PatchMainMode;
    subMode: PatchSubMode | null;
}

interface PatchActions {
    setSourceText: (text: string) => void;
    setDestText: (text: string) => void;
    setSourceTokenData: (tokenData: Token[]) => void;
    setDestTokenData: (tokenData: Token[]) => void;
    setMainMode: (mode: PatchMainMode) => void;
    setSubMode: (mode: PatchSubMode | null) => void;
}

const PatchContext = createContext<(PatchState & PatchActions) | null>(null);

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

    // Mode
    const [mainMode, setMainMode] = useState<PatchMainMode>("edit");
    const [subMode, setSubMode] = useState<PatchSubMode | null>(null);

    const value: PatchState & PatchActions = {
        sourceText,
        destText,
        mainMode,
        subMode,
        sourceTokenData,
        destTokenData,

        setSourceText,
        setDestText,
        setSourceTokenData,
        setDestTokenData,
        setMainMode,
        setSubMode,
    };

    return (
        <PatchContext.Provider value={value}>
            {children}
        </PatchContext.Provider>
    );
}