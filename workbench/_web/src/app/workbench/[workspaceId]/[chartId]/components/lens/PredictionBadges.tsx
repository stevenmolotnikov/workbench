import { useEffect, useMemo } from "react";
import Select, {
    MultiValue,
    type FilterOptionOption,
    type StylesConfig,
    MultiValueProps
} from "react-select";
import { LensConfigData } from "@/types/lens";
import { Prediction } from "@/types/models";
import { useLensWorkspace } from "@/stores/useLensWorkspace";

interface PredictionBadgesProps {
    config: LensConfigData;
    setConfig: (config: LensConfigData) => void;
    predictions: Prediction[];
}

// Token option for react-select
interface TokenOption {
    value: number; // token id
    label: string; // token text
    prob: number;  // probability
    normalizedLabel: string; // label with leading space trimmed and lowercased for matching
}

export const PredictionBadges = ({
    config,
    setConfig,
    predictions,
}: PredictionBadgesProps) => {
    const currentTokenPrediction = predictions?.[0];

    // Helper function to render token text with blue underscore for leading spaces
    const renderTokenText = (text: string | undefined) => {
        if (!text) return "";
        if (text.startsWith(" ")) {
            return (
                <>
                    <span className="text-blue-500">_</span>
                    {text.slice(1)}
                </>
            );
        }
        return text;
    };

    // Build options from all predicted tokens
    const options: TokenOption[] = useMemo(() => {
        if (!currentTokenPrediction) return [];
        return currentTokenPrediction.ids.map((id: number, index: number) => {
            const text = currentTokenPrediction.texts[index] ?? "";
            const prob = currentTokenPrediction.probs[index] ?? 0;
            const normalizedLabel = text.replace(/^\s+/, "").toLowerCase();
            return { value: id, label: text, prob, normalizedLabel } as TokenOption;
        });
    }, [currentTokenPrediction]);

    // Default to the top token (index 0) if none selected yet
    useEffect(() => {
        if (!currentTokenPrediction) return;
        if (config.token.targetIds.length === 0 && currentTokenPrediction.ids.length > 0) {
            setConfig({
                ...config,
                token: { ...config.token, targetIds: [currentTokenPrediction.ids[0]] },
            });
        }
    }, [currentTokenPrediction]);

    const selectedOptions: TokenOption[] = useMemo(() => {
        if (!options.length) return [];
        const idSet = new Set(config.token.targetIds);
        return options.filter(opt => idSet.has(opt.value));
    }, [options, config.token.targetIds]);

    const handleChange = (newValue: MultiValue<TokenOption>) => {
        const newIds = newValue.map(opt => opt.value);
        setConfig({
            ...config,
            token: { ...config.token, targetIds: newIds },
        });
    };

    // Custom filtering: compare against leading-space-trimmed, lowercased tokens
    const filterOption = (
        option: FilterOptionOption<TokenOption>,
        rawInput: string
    ) => {
        const input = rawInput.replace(/^\s+/, "").toLowerCase();
        if (!input) return true;
        return (
            option.data.normalizedLabel.includes(input) ||
            String(option.value).includes(input)
        );
    };

    const {highlightedLineIds} = useLensWorkspace()

    const formattedSelectStyles = useMemo(() => {
        return {
            ...selectStyles,
            multiValue: (base: MultiValueProps<TokenOption>, { data }: { data: TokenOption }) => {
                // Example: if the token has a high probability (>0.5), use a different border color

                const isHighlighted = highlightedLineIds.has(data.label);

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
                    borderRadius: "0.375rem",
                    paddingLeft: 2,
                    paddingRight: 2,
                };
            },
        }
    }, [highlightedLineIds])

    if (!currentTokenPrediction) {
        return (
            <div>
                No predictions for this token.
            </div>
        );
    }

    return (
        <div className="w-full flex-1 min-w-[12rem]">
            <Select<TokenOption, true>
                classNamePrefix="pred-select"
                isMulti
                isClearable
                options={options}
                value={selectedOptions}
                onChange={handleChange}
                filterOption={filterOption}
                styles={formattedSelectStyles}
                placeholder="Select tokens…"
                closeMenuOnSelect={false}
                formatOptionLabel={(option: TokenOption) => (
                    <div className="flex items-center justify-between w-full">
                        <span className="font-medium text-foreground">{renderTokenText(option.label)}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{option.prob.toFixed(4)}</span>
                    </div>
                )}
                components={{
                    // DropdownIndicator: () => null,
                    IndicatorSeparator: () => null
                }}
                onKeyDown={(e) => {
                    // Space key should not be used to select tokens
                    if (e.key === ' ' && !e.currentTarget.querySelector('input')?.value) {
                        e.preventDefault();
                    }
                }}
            />
        </div>
    );
};


// Theme-aware styles for react-select using shadcn/tailwind CSS variables
const selectStyles: StylesConfig<TokenOption, true> = {
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
        paddingRight: 6,
        ':hover': {
            borderColor: "hsl(var(--input))",
        },
    }),
    valueContainer: (base) => ({
        ...base,
        position: "relative",
        paddingTop: 4,
        paddingBottom: 4,
        paddingLeft: 6,
        gap: 4,
        display: "flex",
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
    }),
    singleValue: (base) => ({
        ...base,
        color: "hsl(var(--foreground))",
        lineHeight: "1rem",
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
    indicatorsContainer: (base) => ({
        ...base,
        padding: 0,
        gap: 2,
        alignItems: "center",
    }),
    clearIndicator: (base) => ({
        ...base,
        color: "hsl(var(--muted-foreground))",
        padding: 0,
        height: "1rem",
        width: "1rem",
        display: "flex",
        alignItems: "center",
        cursor: "pointer",
        justifyContent: "center",
        alignSelf: "center",
        ':hover': {
            color: "hsl(var(--foreground))",
        },
    }),
    dropdownIndicator: (base) => ({
        ...base,
        color: "hsl(var(--muted-foreground))",
        padding: 0,
        height: "1rem",
        width: "1rem",
        display: "flex",
        alignItems: "center",
        cursor: "pointer",
        justifyContent: "center",
        alignSelf: "center",
        ':hover': {
            color: "hsl(var(--foreground))",
        },
    }),
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
        backgroundColor: state.isSelected
            ? "hsl(var(--accent))"
            : state.isFocused
                ? "hsl(var(--accent))"
                : "transparent",
        color: state.isSelected || state.isFocused
            ? "hsl(var(--accent-foreground))"
            : "hsl(var(--popover-foreground))",
    }),
};