"use client";

import { cn } from "@/lib/utils";
import type { Token } from "@/types/models";
import type { LensConfigData } from "@/types/lens";

interface TokenAreaProps {
    config: LensConfigData;
    setConfig: (config: LensConfigData) => void;
    tokenData: Token[];
    showPredictionDisplay?: boolean;
    setSelectedIdx?: (idx: number) => void;
}

// Token styling constants
const TOKEN_STYLES = {
    base: "text-sm whitespace-pre-wrap select-none !box-border relative",
    highlight: "bg-primary/30 after:absolute after:inset-0 after:border after:border-primary/30",
    filled: "bg-primary/70 after:absolute after:inset-0 after:border after:border-primary/30",
    hover: "hover:bg-primary/20 hover:after:absolute hover:after:inset-0 hover:after:border hover:after:border-primary/30",
} as const;

const fix = (text: string) => {
    const numNewlines = (text.match(/\n/g) || []).length;

    const result = text
        .replace(/\r\n/g, '\\r\\n')  // Windows line endings
        .replace(/\n/g, '\\n')       // Newlines
        .replace(/\r/g, '\\r')       // Carriage returns
        .replace(/\t/g, '\\t')       // Tabs

    return {
        result: result,
        numNewlines: numNewlines,
    }
}

export function TokenArea({
    config,
    setConfig,
    tokenData,
    showPredictionDisplay = false,
    setSelectedIdx = () => {},
}: TokenAreaProps) {
    const highlightedTokens = config.tokens.map(t => t.idx);

    const handleTokenClick = (idx: number) => {
        if (highlightedTokens.includes(idx)) {
            // Unhighlight this specific token
            setConfig({
                ...config,
                tokens: config.tokens.filter((t) => t.idx !== idx),
            });
        } else {
            setConfig({
                ...config,
                tokens: [...config.tokens, { idx, id: 0, text: "" }],
            });
        }
    };

    const getTokenStyle = (
        token: Token,
        idx: number,
    ) => {
        const isHighlighted = highlightedTokens.includes(idx);
        const isFilled = config.tokens.some(t => t.idx === idx && t.targetId !== undefined);

        let backgroundStyle = "";
        if (isHighlighted) {
            backgroundStyle = isFilled ? TOKEN_STYLES.filled : TOKEN_STYLES.highlight;
        } else {
            backgroundStyle = "bg-transparent";
        }

        console.log(isFilled, config.tokens);


        return cn(
            TOKEN_STYLES.base,
            backgroundStyle,
            (!showPredictionDisplay && !isFilled) && TOKEN_STYLES.hover,
            token.targetText === "\\n" ? "w-full" : "w-fit",
            !showPredictionDisplay && "cursor-pointer"
        );
    };

    return (
        <>
            {tokenData && tokenData.length > 0 ? (
                <div
                    className="max-h-40 overflow-y-auto custom-scrollbar select-none whitespace-pre-wrap"
                    style={{ display: "inline" }}
                >
                    {tokenData.map((token, idx) => {
                        const styles = getTokenStyle(
                            token,
                            idx,
                        );

                        const { result, numNewlines } = fix(token.text);

                        return (
                            <span key={`token-${idx}`}>
                                <span

                                    data-token-id={idx}
                                    className={styles}
                                    onClick={() => {
                                        if (showPredictionDisplay) {
                                            setSelectedIdx(idx);
                                        } else {
                                            handleTokenClick(idx);
                                        }
                                    }}
                                >
                                    {result}
                                </span>
                                {numNewlines > 0 && "\n".repeat(numNewlines)}
                            </span>
                        );
                    })}
                </div>
            ) : (
                <span className="text-sm text-muted-foreground">
                    Tokenizing...
                </span>
            )}
        </>
    )
}
