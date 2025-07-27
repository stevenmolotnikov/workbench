import { useState } from "react";
import LensTransformer from "@/components/LensTransformer";

export default function InteractiveDisplay() {
    // Generate some sample labels
    const tokenLabels = ["The", "quick", "brown", "fox", "jumps"];
    const unembedLabels = ["cat", "dog", "bird", "fish", "lion"];
    const [mode, setMode] = useState<"component" | "row">("component");
    const [selectedRow, setSelectedRow] = useState<{tokenIndex: number, layerIndex: number} | null>(null);

    const clickHandler = (tokenIndex: number, layerIndex: number) => {
        console.log(`Clicked token ${tokenIndex} at layer ${layerIndex}`);
        setSelectedRow({ tokenIndex, layerIndex });
    }
    
    return (
        <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Logit Lens Visualization</h3>
            <div className="mb-4">
                <div className="flex gap-2 mb-2">
                <button 
                    onClick={() => setMode("component")}
                    className={`px-3 py-1 rounded ${mode === "component" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                >
                    Component Hover
                </button>
                <button 
                    onClick={() => setMode("row")}
                    className={`px-3 py-1 rounded ${mode === "row" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                >
                    Row Hover
                </button>
                </div>
                {mode === "row" && selectedRow && (
                    <div className="text-sm text-gray-600">
                        Selected: Token "{tokenLabels[selectedRow.tokenIndex]}" (index {selectedRow.tokenIndex}), Layer {selectedRow.layerIndex}
                    </div>
                )}
            </div>
            <LensTransformer 
                clickHandler={clickHandler}
                rowMode={mode === "row"} 
                numTokens={5} 
                numLayers={3} 
                scale={0.5} 
                showFlowOnHover={true}
                tokenLabels={tokenLabels} 
                unembedLabels={unembedLabels} 
            />
        </div>
    );
}