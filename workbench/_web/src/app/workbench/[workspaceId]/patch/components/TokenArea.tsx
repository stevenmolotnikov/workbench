"use client";

import { cn } from "@/lib/utils";
import type { Token } from "@/types/models";
import { usePatch } from "./PatchProvider";
import { useConnections } from "./ConnectionsProvider";

interface TokenAreaProps {
    side: "source" | "destination";
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
    side
}: TokenAreaProps) {
    const { sourceTokenData, destTokenData } = usePatch();
    const { startConnection, enterToken, endConnection, drag, clearHover } = useConnections();

    const tokenData = side === "source" ? sourceTokenData : destTokenData;

    const getTokenStyle = (
        token: Token,
        idx: number,
    ) => {
        const isDropHover = drag.isDragging && drag.startSide === "source" && side === "destination" && drag.hoverIdx === idx;
        return cn(
            TOKEN_STYLES.base,
            isDropHover ? TOKEN_STYLES.highlight : "bg-transparent",
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
                            data-token-side={side}
                            data-token-id={idx}
                            className={styles}
                            onMouseDown={() => startConnection(side, idx)}
                            onMouseEnter={() => enterToken(side, idx)}
                            onMouseLeave={() => side === "destination" && clearHover()}
                            onMouseUp={() => endConnection(side, idx)}
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
