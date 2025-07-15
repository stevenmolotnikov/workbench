import { Chart } from "./charts";
import { LensWorkspace } from "./lens";
import { PatchingWorkspace } from "./patching";

export type Layout = 0 | 1 | 2 | 3;

export interface Prediction {
    id: string;
    indices: number[];
    str_indices: string[];
}

export interface Completion { 
    id: string;
    prompt: string;
}

export interface Model {
    name: string;
    type: "chat" | "base";
}

export interface ChartMode {
    name: string;
    description: string;
    icon: React.ElementType;
    component: React.ComponentType<{ index: number }>;
}

export type WorkspaceData = {
    lens: LensWorkspace;
    patching: PatchingWorkspace;
};

export interface Workspace {
    id: string;
    name: string;
    public: boolean;
    charts: Chart[];
}