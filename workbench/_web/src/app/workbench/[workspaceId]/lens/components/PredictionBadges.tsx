import { useEffect, useMemo } from "react";
import Select, { MultiValue, StylesConfig } from "react-select";
import { LensConfigData } from "@/types/lens";
import { Prediction } from "@/types/models";

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        option: any,
        rawInput: string
    ) => {
        const input = rawInput.replace(/^\s+/, "").toLowerCase();
        if (!input) return true;
        return (
            option.data.normalizedLabel.includes(input) ||
            String(option.value).includes(input)
        );
    };

    const styles: StylesConfig<TokenOption, true> = {
        control: (base) => ({ ...base, minHeight: 32, borderRadius: 6 }),
        valueContainer: (base) => ({ ...base, paddingTop: 2, paddingBottom: 2 }),
        multiValue: (base) => ({ ...base, backgroundColor: "hsl(var(--muted))" }),
        multiValueLabel: (base) => ({ ...base, fontSize: 12 }),
        option: (base) => ({ ...base, fontSize: 12 }),
        input: (base) => ({ ...base, fontSize: 12 }),
        placeholder: (base) => ({ ...base, fontSize: 12 }),
    };

    if (!currentTokenPrediction) {
        return (
            <div>
                No predictions for this token.
            </div>
        );
    }

    return (
        <div className="w-full max-w-xl">
            <Select<TokenOption, true>
                classNamePrefix="pred-select"
                isMulti
                isClearable
                options={options}
                value={selectedOptions}
                onChange={handleChange}
                filterOption={filterOption}
                placeholder="Select tokens…"
                closeMenuOnSelect={false}
                styles={styles}
                formatOptionLabel={(option: TokenOption) => (
                    <div className="flex items-center justify-between w-full">
                        <span className="font-medium">{option.label}</span>
                        <span className="opacity-70 ml-2 text-xs">{option.prob.toFixed(4)}</span>
                    </div>
                )}
            />
        </div>
    );
};
