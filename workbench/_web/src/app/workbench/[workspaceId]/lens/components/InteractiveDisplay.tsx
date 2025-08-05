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

export default function InteractiveDisplay({ initialConfig }: { initialConfig: LensConfig }) {
    // Generate some sample labels
    const { selectedModel } = useWorkspace();
    const [tokenData, setTokenData] = useState<Token[]>([]);
    const [clickedComponent, setClickedComponent] = useState<SelectedComponent | null>(null);
    const [showFlow, setShowFlow] = useState(false);

    const [config, setConfig] = useState<LensConfigData>(initialConfig.data);

    // Two-knob slider state
    const [sliderValues, setSliderValues] = useState<[number, number]>([0, selectedModel?.n_layers || 0]);

    const handleSliderChange = (value: [number, number]) => {
        setSliderValues(value);
    };

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-medium">Model</h2>
                    <ModelSelector />
                </div>
            </div>

            <div className="p-4">
                <CompletionCard config={config} setConfig={setConfig} configId={initialConfig.id} />
            </div>

            <div className="px-4 pb-4 h-full overflow-auto flex flex-col">
                <div className="flex gap-2 p-4 border-t border-x rounded-t">
                    <DoubleSlider
                        value={sliderValues}
                        onValueChange={handleSliderChange}
                        min={0}
                        max={selectedModel?.n_layers || 0}
                        step={2}
                        className="w-1/2"
                    />
                    <div className="text-xs border rounded-md p-2 h-8 w-32 items-center justify-center flex text-muted-foreground">
                        [{sliderValues[0]}, {sliderValues[1]}]
                    </div>
                    {!showFlow ? (
                        <Button
                            variant="outline"
                            onClick={() => setShowFlow(true)}
                        >
                            Run Token
                        </Button>
                    ) : (
                        <div className="text-sm h-8 border items-center justify-center flex rounded-md bg-muted p-2">
                            Select a row.
                        </div>
                    )}
                    <Button
                        variant="outline"
                        onClick={() => setClickedComponent(null)}
                        disabled={!clickedComponent}
                    >
                        Clear
                    </Button>
                </div>
                <ScrollArea className="h-full w-full pt-4 flex rounded-b items-center justify-center border">
                    <LensTransformer
                        clickedComponent={clickedComponent}
                        setClickedComponent={setClickedComponent}
                        rowMode={true}
                        numTokens={tokenData.length}
                        layerRange={sliderValues}
                        scale={0.6}
                        showFlowOnHover={showFlow}
                        tokenLabels={tokenData.map((token) => token.text)}
                    />
                </ScrollArea>
            </div>
        </div>
    );
}