import type { Completion } from "@/types/workspace"
import type { ChartData } from "@/stores/useCharts"

export interface TokenCompletion {
    idx: number;
    target_id: number;
    target_text: string;
}

export interface Prompt {
    id: string;
    text: string;
    name?: string;
    tokens?: TokenCompletion[];
}

export interface LensCompletion extends Completion { 
    name: string;
    model: string;
    prompts: Prompt[];
    selectedPromptId?: string;
    chartMode?: number; // Index into chart modes array
    chartData?: ChartData;
    // Legacy support - will be removed
    tokens: TokenCompletion[];
}