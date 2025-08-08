import { useState } from "react";
import LensTransformer, { SelectedComponent } from "@/components/transformer/InteractiveTransformer";
import { encodeText } from "@/actions/tokenize";
import { LensConfigData } from "@/types/lens";
import { Button } from "@/components/ui/button";
import { ModelSelector } from "@/components/ModelSelector";
import { useWorkspace } from "@/stores/useWorkspace";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DoubleSlider } from "@/components/ui/double-slider";
import { Token } from "@/types/models";
import { LensConfig } from "@/db/schema";
import { CompletionCard } from "./CompletionCard";
import { useLensCharts } from "@/hooks/useLensCharts";
import { ChevronRight, ChevronDown, RotateCcw } from "lucide-react";
import { useLensWorkspace } from "@/stores/useLensWorkspace";

export default function InteractiveDisplay({ initialConfig }: { initialConfig: LensConfig }) {
    // Generate some sample labels
    const { selectedModel } = useWorkspace();

    const { tokenData, clickedComponent, setClickedComponent } = useLensWorkspace();
    const [isExpanded, setIsExpanded] = useState(false);

    const [config, setConfig] = useState<LensConfigData>(initialConfig.data);

    // Two-knob slider state

    const getSliderValues = (): [number, number] => {
        if (!selectedModel) {
            return [0, 0];
        }
        return [0, selectedModel.n_layers - 1];
    }

    const [sliderValues, setSliderValues] = useState<[number, number]>(getSliderValues());


    return (
        <div className="h-full flex flex-col">
            <div className="px-2 py-2 border-b h-12 flex items-center justify-between">
                <h2 className="text-sm pl-2 font-medium">Model</h2>
                <ModelSelector />
            </div>

            <div className="p-2">
                <CompletionCard config={config} setConfig={setConfig} configId={initialConfig.id} />
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
                                rowMode={true}
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