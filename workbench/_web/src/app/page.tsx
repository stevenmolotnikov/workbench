"use client";

import { useState } from "react";
import Transformer from "@/components/Transformer";

export default function Page() {
    const [numTokens, setNumTokens] = useState(2);
    const [numLayers, setNumLayers] = useState(2);
    const [showAttn, setShowAttn] = useState(true);
    const [showMlp, setShowMlp] = useState(true);
    const [testMode, setTestMode] = useState(false);
    const [testComponentType, setTestComponentType] = useState<'attn' | 'mlp' | 'resid' | 'embed' | 'unembed'>('attn');
    const [testData, setTestData] = useState<number[][] | null>(null);
    const [scale, setScale] = useState(1);

    const MIN_SCALE = 0.5;
    const MAX_SCALE = 2;

    // Use test values if in test mode
    const componentType = testMode ? testComponentType : undefined;
    const data = testMode ? testData || undefined : undefined;
    const isHeatmapMode = componentType !== undefined && data !== undefined;

    // Generate sparse random data for testing
    const generateRandomSparseData = () => {
        const rows = numTokens;
        const cols = numLayers;
        const newData: number[][] = [];
        
        for (let i = 0; i < rows; i++) {
            const row: number[] = [];
            for (let j = 0; j < cols; j++) {
                // 25% chance of non-zero value
                if (Math.random() < 0.25) {
                    row.push(Math.random());
                } else {
                    row.push(0);
                }
            }
            newData.push(row);
        }
        
        setTestData(newData);
        setTestMode(true);
    };

    const handleZoom = (delta: number) => {
        setScale(prevScale => {
            const newScale = prevScale + delta;
            return Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
        });
    };
    
    // Generate random strings for labels
    const generateRandomString = (maxLength: number) => {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const length = Math.floor(Math.random() * maxLength) + 1;
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };
    
    // Generate token labels and unembed labels based on numTokens
    const tokenLabels = Array.from({ length: numTokens }, () => generateRandomString(5));
    const unembedLabels = Array.from({ length: numTokens }, () => generateRandomString(5));

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 border">
            <div className="mb-4 flex flex-col gap-2">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <label htmlFor="numTokens" className="text-gray-700 font-medium">
                                Number of Tokens:
                            </label>
                            <input
                                id="numTokens"
                                type="number"
                                min="1"
                                max="10"
                                value={numTokens}
                                onChange={(e) => setNumTokens(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                                className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label htmlFor="numLayers" className="text-gray-700 font-medium">
                                Number of Layers:
                            </label>
                            <input
                                id="numLayers"
                                type="number"
                                min="1"
                                max="5"
                                value={numLayers}
                                onChange={(e) => setNumLayers(Math.max(1, Math.min(5, parseInt(e.target.value) || 1)))}
                                className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <input
                                id="showAttn"
                                type="checkbox"
                                checked={showAttn}
                                onChange={(e) => setShowAttn(e.target.checked)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="showAttn" className="text-gray-700 font-medium">
                                Show Attention
                            </label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                id="showMlp"
                                type="checkbox"
                                checked={showMlp}
                                onChange={(e) => setShowMlp(e.target.checked)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="showMlp" className="text-gray-700 font-medium">
                                Show MLP
                            </label>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t">
                        <button
                            onClick={generateRandomSparseData}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Test Heatmap
                        </button>
                        {testMode && (
                            <>
                                <select
                                    value={testComponentType}
                                    onChange={(e) => setTestComponentType(e.target.value as 'attn' | 'mlp' | 'resid' | 'embed' | 'unembed')}
                                    className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="attn">Attention</option>
                                    <option value="mlp">MLP</option>
                                    <option value="resid">Residual</option>
                                    <option value="embed">Embed</option>
                                    <option value="unembed">Unembed</option>
                                </select>
                                <button
                                    onClick={() => {
                                        setTestMode(false);
                                        setTestData(null);
                                    }}
                                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                >
                                    Exit Test Mode
                                </button>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-gray-700 font-medium">Zoom:</label>
                        <button
                            onClick={() => handleZoom(-0.1)}
                            className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            disabled={scale <= MIN_SCALE}
                        >
                            -
                        </button>
                        <span className="px-3 py-1 text-gray-700">{Math.round(scale * 100)}%</span>
                        <button
                            onClick={() => handleZoom(0.1)}
                            className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            disabled={scale >= MAX_SCALE}
                        >
                            +
                        </button>
                        <button
                            onClick={() => setScale(1)}
                            className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                            Reset
                        </button>
                    </div>
                </div>
            <Transformer
                componentType={componentType}
                data={data}
                numTokens={numTokens}
                numLayers={numLayers}
                showAttn={showAttn}
                showMlp={showMlp}
                scale={scale}
                tokenLabels={tokenLabels}
                unembedLabels={unembedLabels}
            />
        </div>
    );
}