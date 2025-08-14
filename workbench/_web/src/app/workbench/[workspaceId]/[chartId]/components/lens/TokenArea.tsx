"use client";

import { cn } from "@/lib/utils";
import type { Token } from "@/types/models";
import type { LensConfigData } from "@/types/lens";
import { useWorkspace } from "@/stores/useWorkspace";

interface TokenAreaProps {
    config: LensConfigData;
    handleTokenClick: (idx: number) => void;
    tokenData: Token[];
}

// Token styling constants
const TOKEN_STYLES = {
    base: "text-sm whitespace-pre-wrap select-none !box-border relative",
    highlight: "bg-primary/30 ring-1 ring-primary/30 ring-inset",
    filled: "bg-primary/70 ring-1 ring-primary/30 ring-inset",
    hover: "hover:bg-primary/20 hover:ring-1 hover:ring-primary/30 hover:ring-inset",
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
}: TokenAreaProps) {
    const { currentChartType } = useWorkspace();

    const getTokenStyle = (
        token: Token,
        idx: number,
    ) => {
        const isFilled = config.token.targetIds.length > 0;

        let backgroundStyle = "";
        if (config.token.idx === idx && currentChartType === "line") {
            backgroundStyle = (isFilled) ? TOKEN_STYLES.filled : TOKEN_STYLES.highlight;
        } else {
            backgroundStyle = "bg-transparent";
        }

        return cn(
            TOKEN_STYLES.base,
            backgroundStyle,
            TOKEN_STYLES.hover,
            token.text === "\\n" ? "w-full" : "w-fit",
            "cursor-pointer",
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
