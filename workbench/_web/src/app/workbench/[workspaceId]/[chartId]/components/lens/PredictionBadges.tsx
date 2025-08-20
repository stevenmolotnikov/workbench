import { useCallback, useEffect, useMemo, useState } from "react";
import AsyncSelect from "react-select/async";
import type { MultiValue, StylesConfig, GroupBase } from "react-select";
import { LensConfigData } from "@/types/lens";
import { TokenOption } from "@/types/models";
import { useLensWorkspace } from "@/stores/useLensWorkspace";
import { useDebouncedCallback } from "use-debounce";
import { X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface PredictionBadgesProps {
    config: LensConfigData;
    setConfig: (config: LensConfigData) => void;
    runLineChart: () => void;
}

export const PredictionBadges = ({
    config,
    setConfig,
    runLineChart,
}: PredictionBadgesProps) => {
    const prediction = config.prediction;

    const probLookup = useMemo(() => {
        if (!prediction) return null as Map<number, number> | null;
        return new Map<number, number>(
            prediction.ids.map((id: number, idx: number) => [
                id,
                prediction.probs[idx] ?? 0,
            ])
        );
    }, [prediction]);

    // Helper function to render token text with blue underscore for leading spaces and blue "\n" for newlines
    const renderTokenText = (text: string | undefined) => {
        if (!text) return "";
        const elements: React.ReactNode[] = [];
        let index = 0;

        // Represent a single leading space with a blue underscore for visibility
        if (text.startsWith(" ")) {
            elements.push(<span className="text-blue-500" key={`lead-space`}>_</span>);
            index = 1;
        }

        let buffer = "";
        for (; index < text.length; index++) {
            const ch = text[index];
            if (ch === "\n") {
                if (buffer) {
                    elements.push(<span key={`txt-${index}`}>{buffer}</span>);
                    buffer = "";
                }
                elements.push(<span className="text-blue-500" key={`nl-${index}`}>\n</span>);
            } else {
                buffer += ch;
            }
        }
        if (buffer) elements.push(<span key={`tail`}>{buffer}</span>);

        return elements.length ? <>{elements}</> : text;
    };

    // Build options from all predicted tokens
    const options: TokenOption[] = useMemo(() => {
        if (!prediction) return [];
        return prediction.ids.map((id: number, index: number) => {
            const text = prediction.texts[index] ?? "";
            const prob = prediction.probs[index] ?? 0;
            return { value: id, text, prob } as TokenOption;
        });
    }, [prediction]);

    // Maintain a local registry of known options so selections from queries persist
    const [knownOptionsById, setKnownOptionsById] = useState<Map<number, TokenOption>>(new Map());

    // Sync prediction options into known registry
    useEffect(() => {
        if (options.length === 0) return;
        setKnownOptionsById(prev => {
            const updated = new Map(prev);
            for (const opt of options) {
                updated.set(opt.value, opt);
            }
            return updated;
        });
    }, [options]);

    const selectedOptions: TokenOption[] = useMemo(() => {
        if (config.token.targetIds.length === 0) return [];
        return config.token.targetIds
            .map(id => knownOptionsById.get(id))
            .filter((v): v is TokenOption => !!v);
    }, [knownOptionsById, config.token.targetIds]);

    const handleChange = (newValue: MultiValue<TokenOption>) => {
        const newIds = newValue.map(opt => opt.value);
        // Persist any newly chosen options into the registry
        setKnownOptionsById(prev => {
            const updated = new Map(prev);
            for (const opt of newValue) {
                updated.set(opt.value, opt);
            }
            return updated;
        });
        setConfig({
            ...config,
            token: { ...config.token, targetIds: newIds },
        });
        runLineChart();
    };

    const debouncedFetch = useDebouncedCallback(
        async (
            query: string,
            model: string,
            pLookup: Map<number, number> | null,
            resolve: (options: TokenOption[]) => void
        ) => {
            const raw = (query ?? "");
            if (raw.length === 0) {
                resolve([]);
                return;
            }
            try {
                const resp = await fetch("/api/tokens/query", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ query: raw, model, limit: 50 }),
                });
                const data = (await resp.json()) as { tokens?: TokenOption[] };
                const tokens = data.tokens ?? [];

                // Attach probs and sort by probability descending
                const opts = tokens.map((t) => ({
                    value: t.value,
                    text: t.text,
                    prob: pLookup?.get(t.value) ?? 0,
                } as TokenOption));

                opts.sort((a, b) => (b.prob ?? 0) - (a.prob ?? 0));
                resolve(opts);
            } catch {
                resolve([]);
            }
        },
        500
    );

    const loadOptions = useCallback(
        (inputValue: string): Promise<TokenOption[]> =>
            new Promise((resolve) => {
                debouncedFetch.cancel();
                // If input is empty or whitespace-only, show predictions; otherwise query
                const raw = inputValue ?? "";
                if (raw.length === 0 || /^\s*$/.test(raw)) {
                    resolve(options);
                } else {
                    debouncedFetch(inputValue, config.model, probLookup, (fetched) => {
                        // Merge fetched options into known registry for persistence
                        setKnownOptionsById(prev => {
                            const updated = new Map(prev);
                            for (const opt of fetched) updated.set(opt.value, opt);
                            return updated;
                        });
                        resolve(fetched);
                    });
                }
            }),
        [debouncedFetch, config.model, probLookup, options]
    );


    const [inputValue, setInputValue] = useState<string>("");

    if (!prediction) {
        return null;
    }

    return (
        <div className="flex flex-col gap-1.5 w-full">
            <div className="flex justify-between items-center">

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="inline-block">
                            <span className="text-xs">Target Tokens
                            </span>
                            </span>
                        </TooltipTrigger>
                        <TooltipContent side="right" >Default top 3</TooltipContent>
                    </Tooltip>

                {config.token.targetIds.length > 0 &&
                    <button
                        className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                            setConfig({
                                ...config,
                                token: { ...config.token, targetIds: [] },
                            });
                        }}
                    >
                        <X className="w-3 h-3" />
                        Clear
                    </button>}
            </div>
            <div className="w-full flex-1 min-w-[12rem]">
                <AsyncSelect<TokenOption, true>
                    classNamePrefix="pred-select"
                    isMulti
                    isClearable
                    defaultOptions={options}
                    cacheOptions
                    loadOptions={loadOptions}
                    value={selectedOptions}
                    onChange={handleChange}
                    styles={selectStyles}
                    placeholder="Enter a token..."
                    closeMenuOnSelect={false}
                    inputValue={inputValue}
                    onInputChange={(newValue) => {
                        setInputValue(newValue);
                    }}
                    formatOptionLabel={(option: TokenOption) => (
                        <div className="flex items-center justify-between w-full">
                            <span className="font-medium text-foreground">{renderTokenText(option.text)}</span>
                            <span className="ml-2 text-xs text-muted-foreground">{(option.prob ?? 0).toFixed(4)}</span>
                        </div>
                    )}
                    components={{
                        IndicatorSeparator: () => null,
                        DropdownIndicator: () => null,
                        ClearIndicator: () => null,
                        IndicatorsContainer: () => null,
                    }}
                    onKeyDown={(e) => {
                        // Allow leading space by manually inserting into controlled input, while preventing option selection
                        if (e.key === ' ' && inputValue.length === 0) {
                            e.preventDefault();
                            setInputValue(' ');
                        }
                    }}
                />
            </div>
        </div>
    );
};


// Theme-aware styles for react-select using shadcn/tailwind CSS variables
const selectStyles: StylesConfig<TokenOption, true, GroupBase<TokenOption>> = {
    container: (base) => ({
        ...base,
        width: "100%",
    }),
    control: (base, state) => ({
        ...base,
        backgroundColor: "hsl(var(--background))",
        borderColor: state.isFocused
            ? "hsl(var(--ring))"
            : "hsl(var(--input))",
        boxShadow: state.isFocused
            ? "0 0 0 1px hsl(var(--ring))"
            : "none",
        boxSizing: "border-box",
        minHeight: "2rem", // match h-8 icon buttons while allowing wrap growth
        fontSize: "0.875rem", // text-sm
        lineHeight: "1rem",
        alignItems: "center",
        paddingTop: 0,
        paddingBottom: 0,
        paddingLeft: 0,
        paddingRight: 0,
        ':hover': {
            borderColor: "hsl(var(--input))",
        },
    }),
    valueContainer: (base) => ({
        ...base,
        position: "relative",
        paddingTop: 4,
        paddingBottom: 4,
        paddingLeft: 4,
        gap: 4,
        alignItems: "center",
        minHeight: "2rem",
        flexWrap: "wrap",
    }),
    input: (base) => ({
        ...base,
        color: "hsl(var(--foreground))",
        margin: 0,
        padding: 0,
        order: 1,
        minWidth: 2,
        paddingLeft: 2,
    }),
    multiValueLabel: (base) => ({
        ...base,
        color: "hsl(var(--muted-foreground))",
        padding: "0 8px",
        lineHeight: "1.125rem",
    }),
    multiValueRemove: (base) => ({
        ...base,
        color: "hsl(var(--muted-foreground))",
        padding: 0,
        height: "0.75rem",
        width: "0.75rem",
        ':hover': {
            backgroundColor: "hsl(var(--accent))",
            color: "hsl(var(--accent-foreground))",
        },
    }),
    multiValue: (base, props) => {
        const isHighlighted = useLensWorkspace.getState().highlightedLineIds.has(props.data.text);
        return {
            ...base,
            backgroundColor: isHighlighted
                ? "hsl(var(--accent))"
                : "hsl(var(--muted))",
            border: isHighlighted
                ? "1px solid hsl(var(--primary))"
                : "1px solid hsl(var(--input))",
            margin: 0,
            alignItems: "center",
            minHeight: "1.25rem",
            borderRadius: "calc(var(--radius) - 4px)",
            paddingLeft: 2,
            paddingRight: 2,
        };
    },
    menu: (base) => ({
        ...base,
        backgroundColor: "hsl(var(--popover))",
        border: "1px solid hsl(var(--border))",
        overflow: "hidden",
        zIndex: 50,
        fontSize: "0.75rem",
    }),
    menuList: (base) => ({
        ...base,
        '&::-webkit-scrollbar': {
            display: 'none',
        },
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isFocused
            ? "hsl(var(--accent))"
            : "transparent",
        color: state.isFocused
            ? "hsl(var(--accent-foreground))"
            : "hsl(var(--popover-foreground))",
        ':active': {
            backgroundColor: "hsl(var(--accent))",
        },
    }),
};