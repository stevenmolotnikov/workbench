import { useState } from "react";
import LensTransformer, { SelectedComponent } from "@/components/LensTransformer";
import { Textarea } from "@/components/ui/textarea";
import { encodeText } from "@/actions/tokenize";
import { toast } from "sonner";
import { LensConfigData } from "@/types/lens";
import { useLensGrid } from "@/lib/api/chartApi";
import { Button } from "../ui/button";
import { ModelSelector } from "../ModelSelector";
import { useSelectedModel } from "@/stores/useSelectedModel";

export default function InteractiveDisplay() {
    // Generate some sample labels
    const { modelName } = useSelectedModel();

    const [tokenLabels, setTokenLabels] = useState<string[]>([]);
    const [predictions, setPredictions] = useState<string[]>([]);
    // const [mode, setMode] = useState<"component" | "row">("component");
    const [selectedRow, setSelectedRow] = useState<{ tokenIndex: number, layerIndex: number } | null>(null);

    const [clickedComponent, setClickedComponent] = useState<SelectedComponent | null>(null);
    const [showFlow, setShowFlow] = useState(false);

    const [inputText, setInputText] = useState("");

    const clickHandler = (tokenIndex: number, layerIndex: number) => {
        console.log(`Clicked token ${tokenIndex} at layer ${layerIndex}`);
        setSelectedRow({ tokenIndex, layerIndex });
        setShowFlow(false);
    }

    const handleTokenize = async () => {
        try {
            const tokens = await encodeText(inputText, modelName);

            if (tokens) {
                setTokenLabels(tokens.map((token) => token.text));
            }

        } catch (err) {
            toast.error("Error tokenizing text");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleTokenize();
        }
    };

    const lensGridMutation = useLensGrid();

    async function createHeatmap(chartId: string) {
        try {

            const config: LensConfigData = {
                name: "Heatmap",
                model: modelName,
                prompt: inputText,
                tokens: []
            }

            const data = await lensGridMutation.mutateAsync({
                completions: [config],
                chartId: chartId
            });

            setPredictions(data.labels[data.labels.length - 1]);
        } catch (error) {
            console.error("Error creating heatmap:", error);
            throw error;
        }
    }

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
                    <Textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="h-24 resize-none"
                        placeholder="Enter your prompt here."
                        id="completion-text"
                    />
                    <div className="flex gap-2 absolute bottom-2 right-2">
                        <Button
                            variant="outline"
                            onClick={() => handleTokenize()}
                        >
                            Tokenize
                        </Button>
                        <Button
                            onClick={() => createHeatmap("heatmap")}
                        >
                            Run
                        </Button>
                    </div>
                </div>
            </div>

            <div className="p-4 flex-1 min-h-0">
                <div className="h-full w-full border rounded flex justify-center relative">
                    <div className="absolute top-2 gap-2 flex right-2 z-50">
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
                    <LensTransformer
                        clickHandler={clickHandler}
                        clickedComponent={clickedComponent}
                        setClickedComponent={setClickedComponent}
                        rowMode={true}
                        numTokens={tokenLabels.length}
                        numLayers={3}
                        scale={0.6}
                        showFlowOnHover={showFlow}
                        tokenLabels={tokenLabels}
                        unembedLabels={predictions}
                    />
                </div>
            </div>
        </div>
    );
}