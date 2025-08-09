import { useEffect, useState } from "react";
import LensTransformer, { type SelectedComponent } from "@/components/transformer/InteractiveTransformer";
import { LensConfigData } from "@/types/lens";
import { ModelSelector } from "@/components/ModelSelector";
import { useWorkspace } from "@/stores/useWorkspace";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CompletionCard } from "./CompletionCard";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useLensWorkspace } from "@/stores/useLensWorkspace";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getOrCreateLensConfigForChart } from "@/lib/queries/chartQueries";

export default function InteractiveDisplay() {
    const { selectedModel, activeTab } = useWorkspace();
    const { workspaceId } = useParams<{ workspaceId: string }>();

    const { tokenData } = useLensWorkspace();
    const [isExpanded, setIsExpanded] = useState(false);
    const [clickedComponent, setClickedComponent] = useState<SelectedComponent | null>(null);

    const defaultConfig: LensConfigData = {
        prompt: "",
        model: selectedModel?.name || "",
        token: { idx: 0, id: 0, text: "", targetIds: [] },
    };

    const { data: configRecord, isSuccess } = useQuery({
        queryKey: ["chartConfig", workspaceId, activeTab],
        queryFn: () => getOrCreateLensConfigForChart(workspaceId as string, activeTab as string, defaultConfig),
        enabled: !!selectedModel && !!activeTab,
        staleTime: 0,
    });

    const [config, setConfig] = useState<LensConfigData | null>(null);

    useEffect(() => {
        if (isSuccess && configRecord) {
            setConfig(configRecord.data);
        } else if (!activeTab) {
            setConfig(null);
        }
    }, [isSuccess, configRecord, activeTab]);

    // Two-knob slider state
    const getSliderValues = (): [number, number] => {
        if (!selectedModel) {
            return [0, 0];
        }
        return [0, selectedModel.n_layers - 1];
    };

    const [sliderValues, setSliderValues] = useState<[number, number]>(getSliderValues());

    if (!activeTab) {
        return (
            <div className="h-full flex items-center justify-center text-muted-foreground">
                Select a chart to edit its config
            </div>
        );
    }

    if (!config || !configRecord) {
        return (
            <div className="h-full flex items-center justify-center text-muted-foreground">
                Loading config…
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="px-2 py-2 border-b h-12 flex items-center justify-between">
                <h2 className="text-sm pl-2 font-medium">Model</h2>
                <ModelSelector />
            </div>

            <div className="p-2">
                <CompletionCard config={config} setConfig={setConfig} configId={configRecord.id} />
            </div>

            <div className="px-2 pb-2 h-full overflow-auto flex flex-col">
                {!isExpanded ? (
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="flex items-center gap-2 p-4 border rounded hover:bg-muted/50 transition-colors w-full text-left"
                    >
                        <ChevronRight className="h-4 w-4" />
                        <span className="text-sm font-medium">View Internals</span>
                    </button>
                ) : (
                    <>
                        <div className="flex gap-2 p-4 justify-between border-t border-x rounded-t">
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="p-1 hover:bg-muted rounded transition-colors"
                            >
                                <ChevronDown className="h-4 w-4" />
                            </button>
                        </div>
                        <ScrollArea className="h-full w-full pt-4 flex rounded-b items-center justify-center border">
                            <LensTransformer
                                clickedComponent={clickedComponent}
                                setClickedComponent={setClickedComponent}
                                rowMode={false}
                                numTokens={tokenData.length}
                                layerRange={sliderValues}
                                scale={0.5}
                                showFlowOnHover={true}
                                tokenLabels={tokenData.map((token) => token.text)}
                            />
                        </ScrollArea>
                    </>
                )}
            </div>
        </div>
    );
}