"use client";

import { cn } from "@/lib/utils";
import type { Token } from "@/types/models";
import type { LensConfigData } from "@/types/lens";

interface TokenAreaProps {
    config: LensConfigData;
    handleTokenClick: (idx: number) => void;
    tokenData: Token[];
    setSelectedIdx?: (idx: number) => void;
}

// Token styling constants
const TOKEN_STYLES = {
    base: "text-sm whitespace-pre-wrap select-none cursor-pointer !box-border relative",
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
    handleTokenClick,
    tokenData,
    setSelectedIdx = () => { },
}: TokenAreaProps) {
    const getTokenStyle = (
        token: Token,
        idx: number,
    ) => {
        const highlightedTokens = config.tokens.map(t => t.idx);
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
            !isFilled && TOKEN_STYLES.hover,
            token.targetText === "\\n" ? "w-full" : "w-fit",
        );
    };

    return (
        <div
            className="max-h-40 overflow-y-auto w-full custom-scrollbar select-none whitespace-pre-wrap"
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
                                handleTokenClick(idx);
                            }}
                        >
                            {result}
                        </span>
                        {numNewlines > 0 && "\n".repeat(numNewlines)}
                    </span>
                );
            })}
        </div>
    )
}
