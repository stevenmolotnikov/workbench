import { useState, useEffect, useRef } from "react";
import LensTransformer, { SelectedComponent } from "@/components/InteractiveTransformer";
import { Textarea } from "@/components/ui/textarea";
import { encodeText } from "@/actions/tokenize";
import { toast } from "sonner";
import { LensConfigData } from "@/types/lens";
import { useLensGrid } from "@/lib/api/chartApi";
import { Button } from "../ui/button";
import { ModelSelector } from "../ModelSelector";
import { useSelectedModel } from "@/stores/useSelectedModel";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getOrCreateLensConfig } from "@/lib/queries/chartQueries";
import { useWorkspace } from "@/stores/useWorkspace";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUpdateChartConfig } from "@/lib/api/configApi";
import { DoubleSlider } from "../ui/double-slider";
import { cn } from "@/lib/utils";
import { TokenArea } from "./TokenArea";
import { Token } from "@/types/models";

export default function InteractiveDisplay() {
    // Generate some sample labels
    const { modelName } = useSelectedModel();
    const { activeTab } = useWorkspace();
    const { workspaceId } = useParams();

    const [tokenData, setTokenData] = useState<Token[]>([]);
    const [predictions, setPredictions] = useState<string[]>([]);
    const [selectedRow, setSelectedRow] = useState<{ tokenIndex: number, layerIndex: number } | null>(null);

    const [clickedComponent, setClickedComponent] = useState<SelectedComponent | null>(null);
    const [showFlow, setShowFlow] = useState(false);

    const { mutateAsync: updateChartConfig } = useUpdateChartConfig();
    const [activeChartConfig, setActiveChartConfig] = useState<LensConfigData>({
        name: "Default Lens Config",
        model: modelName,
        prompt: "",
        tokens: [],
    });

    const { mutateAsync: createHeatmap } = useLensGrid();

    // Two-knob slider state
    const [sliderValues, setSliderValues] = useState<[number, number]>([0, 20]);

    const { data: chartConfig, isLoading: isChartConfigLoading } = useQuery({
        queryKey: ["chartConfig", workspaceId],
        queryFn: () => getOrCreateLensConfig(workspaceId as string, {
            prompt: "",
            name: "Default Lens Config",
            model: modelName,
            tokens: [],
        }),
    });

    useEffect(() => {
        if (chartConfig?.data) {
            setActiveChartConfig(chartConfig.data);
        }
        console.log("UPDATED ACTIVE CHART CONFIG");
    }, [chartConfig]);

    const clickHandler = (tokenIndex: number, layerIndex: number) => {
        setSelectedRow({ tokenIndex, layerIndex });
        setShowFlow(false);
    }

    const handleTokenize = async () => {
        const tokens = await encodeText(activeChartConfig?.prompt || "", modelName);
        setTokenData(tokens);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleTokenize();
        }
    };

    const handleCreateHeatmap = async () => {
        if (!activeTab) return;

        const config: LensConfigData = {
            name: "Heatmap",
            model: modelName,
            prompt: activeChartConfig?.prompt || "",
            tokens: []
        }

        const data = await createHeatmap({
            lensRequest: {
                completion: config,
                chartId: activeTab
            },
            configId: chartConfig?.id || ""
        });

        await updateChartConfig({
            configId: chartConfig?.id || "",
            config: {
                data: config,
                workspaceId: workspaceId as string,
                type: "lens",
            }
        });

        setPredictions(data.labels[data.labels.length - 1]);
    }

    const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (!activeChartConfig) return;

        setActiveChartConfig({
            ...activeChartConfig,
            prompt: e.target.value,
        });
    };

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

            <div className="p-4 border-b">
                <div className="flex relative">

                    {!(tokenData.length > 0) ? (
                        <Textarea
                            value={activeChartConfig?.prompt || ""}
                            onChange={handlePromptChange}
                            onKeyDown={handleKeyDown}
                            className="h-24 resize-none"
                            placeholder="Enter your prompt here."
                            id="completion-text"
                            disabled={isChartConfigLoading || !activeChartConfig}
                        />
                    ) : (
                        <div
                            className="flex flex-col w-full px-3 py-2 border rounded h-24 overflow-y-auto"
                        >
                            <TokenArea
                                config={activeChartConfig}
                                setConfig={setActiveChartConfig}
                                tokenData={tokenData}
                                showPredictionDisplay={false}
                            />
                        </div>
                    )}

                    <div className="flex gap-2 absolute bottom-2 right-2">
                        {(tokenData.length === 0) ? (
                            <Button
                                variant="outline"
                                onClick={() => handleTokenize()}
                            >
                                Tokenize
                            </Button>) : (
                            <Button
                                variant="outline"
                                onClick={() => setTokenData([])}
                            >
                                Clear
                            </Button>)}
                        <Button
                            onClick={() => handleCreateHeatmap()}
                        >
                            Run
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex gap-2 p-4 border-b">
                <DoubleSlider
                    value={sliderValues}
                    onValueChange={handleSliderChange}
                    min={0}
                    max={20}
                    step={2}
                    className="w-full"
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

            <div className="p-4 h-full overflow-auto flex">
                <ScrollArea className="h-full w-full pt-4 flex rounded items-center justify-center border">
                    <LensTransformer
                        clickHandler={clickHandler}
                        clickedComponent={clickedComponent}
                        setClickedComponent={setClickedComponent}
                        rowMode={true}
                        numTokens={tokenData.length}
                        layerRange={sliderValues}
                        scale={0.6}
                        showFlowOnHover={showFlow}
                        tokenLabels={tokenData.map((token) => token.text)}
                        unembedLabels={predictions}
                    />
                </ScrollArea>
            </div>
        </div>
    );
}