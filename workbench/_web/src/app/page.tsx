"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

interface PageProps {
    componentType?: 'attn' | 'mlp' | 'resid';
    data?: number[][];
}

export default function Page({ componentType: propComponentType, data: propData }: PageProps = {}) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [numTokens, setNumTokens] = useState(2);
    const [numLayers, setNumLayers] = useState(2);
    const [showAttn, setShowAttn] = useState(true);
    const [showMlp, setShowMlp] = useState(true);
    const [testMode, setTestMode] = useState(false);
    const [testComponentType, setTestComponentType] = useState<'attn' | 'mlp' | 'resid'>('attn');
    const [testData, setTestData] = useState<number[][] | null>(null);
    
    // Use prop values if provided, otherwise use test values if in test mode
    const componentType = propComponentType || (testMode ? testComponentType : undefined);
    const data = propData || (testMode ? testData || undefined : undefined);

    useEffect(() => {
        if (!svgRef.current) return;

        // Detect heatmap mode
        const isHeatmapMode = componentType !== undefined && data !== undefined;
        
        // Use data dimensions if in heatmap mode
        const effectiveNumTokens = isHeatmapMode && data ? data.length : numTokens;
        const effectiveNumLayers = isHeatmapMode && data && data[0] ? data[0].length : numLayers;

        // Clear any existing content
        d3.select(svgRef.current).selectAll("*").remove();

        const svg = d3.select(svgRef.current);
        const layerWidth = 275;
        const width = effectiveNumLayers * layerWidth + 200;
        const rowHeight = 75;
        const height = effectiveNumTokens * rowHeight + 100;
        const startX = 100;
        const startY = 75;

        // Set SVG dimensions
        svg.attr("width", width).attr("height", height);

        // Create a group for the visualization
        const g = svg.append("g");
        
        // Define colors
        const greyColor = "#9CA3AF";
        const purpleColor = isHeatmapMode ? greyColor : "purple";
        const redColor = isHeatmapMode ? greyColor : "red";
        const greenColor = isHeatmapMode ? greyColor : "green";

        // Function to draw a single layer
        const drawLayer = (layerIndex: number) => {
            const layerStartX = startX + layerIndex * layerWidth;
            const isLastLayer = layerIndex === effectiveNumLayers - 1;

            // Function to draw a single token row within a layer
            const drawTokenRow = (rowIndex: number) => {
                const centerX = layerStartX;
                const centerY = startY + rowIndex * rowHeight;
                const isFirstRow = rowIndex === 0;
                const isLastRow = rowIndex === effectiveNumTokens - 1;

                // Residual-in circle
                const residInRadius = 10;
                const residCircle = g.append("circle")
                    .attr("cx", centerX)
                    .attr("cy", centerY)
                    .attr("r", residInRadius)
                    .attr("stroke", purpleColor)
                    .attr("stroke-width", 2);
                
                // Add fill for heatmap mode
                if (isHeatmapMode && componentType === 'resid' && data && data[rowIndex] && data[rowIndex][layerIndex] !== undefined) {
                    residCircle.attr("fill", "purple").attr("fill-opacity", data[rowIndex][layerIndex]);
                } else {
                    residCircle.attr("fill", "none");
                }

                // Residual arrow that components within the layer (attn, mlp) add to
                const residArrowStartX = centerX + residInRadius;
                const residArrowEndX = centerX + residInRadius + 240;
                const residArrowY = centerY;

                // If not the last layer, connect to the next layer's circle minus its radius
                const actualResidArrowEndX = isLastLayer ? residArrowEndX : layerStartX + layerWidth - residInRadius;

                // Residual arrow line
                g.append("line")
                    .attr("x1", residArrowStartX)
                    .attr("y1", residArrowY)
                    .attr("x2", actualResidArrowEndX)
                    .attr("y2", residArrowY)
                    .attr("stroke", purpleColor)
                    .attr("stroke-width", 2);

                // Residual arrow head (for all layers)
                const arrowHeadSize = 10;
                const arrowHeadX = isLastLayer ? residArrowEndX : actualResidArrowEndX;
                g.append("path")
                    .attr("d", `M ${arrowHeadX - arrowHeadSize} ${residArrowY - arrowHeadSize / 2} L ${arrowHeadX} ${residArrowY} L ${arrowHeadX - arrowHeadSize} ${residArrowY + arrowHeadSize / 2} Z`)
                    .attr("fill", purpleColor);

                // A semi-circle path around the residual-in circle (only if not the first row)
                const attnCrossTokenRadius = 20;
                if ((showAttn || isHeatmapMode) && !isFirstRow) {
                    const attnCrossTokenRoundedPath = `M ${centerX} ${centerY - attnCrossTokenRadius} A ${attnCrossTokenRadius} ${attnCrossTokenRadius} 0 0 1 ${centerX} ${centerY + attnCrossTokenRadius}`;

                    g.append("path")
                        .attr("d", attnCrossTokenRoundedPath)
                        .attr("fill", "none")
                        .attr("stroke", redColor)
                        .attr("stroke-width", 2);
                }

                // Arrow that continues the connection to the next token
                if ((showAttn || isHeatmapMode) && !isLastRow) {
                    const attnCrossTokenX = centerX;
                    const attnCrossTokenStartY = centerY + residInRadius;
                    const nextRowCenterY = startY + (rowIndex + 1) * rowHeight;
                    const attnCrossTokenEndY = nextRowCenterY - attnCrossTokenRadius;

                    // Cross token arrow line
                    g.append("line")
                        .attr("x1", attnCrossTokenX)
                        .attr("y1", attnCrossTokenStartY)
                        .attr("x2", attnCrossTokenX)
                        .attr("y2", attnCrossTokenEndY)
                        .attr("stroke", redColor)
                        .attr("stroke-width", 2);

                    // Cross token arrow head (pointing down, at the end of the line)
                    g.append("path")
                        .attr("d", `M ${attnCrossTokenX - arrowHeadSize / 2} ${attnCrossTokenEndY - arrowHeadSize} L ${attnCrossTokenX} ${attnCrossTokenEndY} L ${attnCrossTokenX + arrowHeadSize / 2} ${attnCrossTokenEndY - arrowHeadSize} Z`)
                        .attr("fill", redColor);
                } else if (showAttn || isHeatmapMode) {
                    // If the last row, we need to draw a cross token arrow that just goes from resid-in to the y level of attn-in
                    const attnCrossTokenX = centerX;
                    const attnCrossTokenStartY = centerY + residInRadius;
                    const attnCrossTokenEndY = centerY + residInRadius + 25;

                    // Cross token arrow line
                    g.append("line")
                        .attr("x1", attnCrossTokenX)
                        .attr("y1", attnCrossTokenStartY)
                        .attr("x2", attnCrossTokenX)
                        .attr("y2", attnCrossTokenEndY)
                        .attr("stroke", redColor)
                        .attr("stroke-width", 2);

                    // Cross token arrow head (pointing down, at the end of the line)
                    g.append("path")
                        .attr("d", `M ${attnCrossTokenX - arrowHeadSize / 2} ${attnCrossTokenEndY - arrowHeadSize} L ${attnCrossTokenX} ${attnCrossTokenEndY} L ${attnCrossTokenX + arrowHeadSize / 2} ${attnCrossTokenEndY - arrowHeadSize} Z`)
                        .attr("fill", redColor);
                }

                // Attn in arrow line variables
                const attnInXStart = centerX;
                const attnXEndOffset = 100;
                const attnInXEnd = centerX + attnXEndOffset;
                const componentY = centerY + residInRadius + 25;

                // Attn in arrow line. This connects from the cross token residual information into the attention component
                if (showAttn || isHeatmapMode) {
                    g.append("line")
                        .attr("x1", attnInXStart)
                        .attr("y1", componentY)
                        .attr("x2", attnInXEnd)
                        .attr("y2", componentY)
                        .attr("stroke", redColor)
                        .attr("stroke-width", 2);

                    // Attn out arrow line variables
                    const attnOutX = attnInXEnd;
                    const attnOutYStart = componentY;
                    const attnOutYEnd = residArrowY;

                    // Attn out arrow line
                    g.append("line")
                        .attr("x1", attnOutX)
                        .attr("y1", attnOutYStart)
                        .attr("x2", attnOutX)
                        .attr("y2", attnOutYEnd)
                        .attr("stroke", redColor)
                        .attr("stroke-width", 2);

                    // Attn out arrow head (pointing up, at the end of the line)
                    g.append("path")
                        .attr("d", `M ${attnOutX - arrowHeadSize / 2} ${attnOutYEnd + arrowHeadSize} L ${attnOutX} ${attnOutYEnd} L ${attnOutX + arrowHeadSize / 2} ${attnOutYEnd + arrowHeadSize} Z`)
                        .attr("fill", redColor);

                    // Attention square
                    const attnWidth = 20;
                    const attnHeight = 20;
                    const attnX = centerX + (attnXEndOffset / 2) - (attnWidth / 2);
                    const attnY = centerY + residInRadius + (25 - attnHeight / 2);

                    const attnRect = g.append("rect")
                        .attr("x", attnX)
                        .attr("y", attnY)
                        .attr("width", attnWidth)
                        .attr("height", attnHeight)
                        .attr("stroke", redColor)
                        .attr("stroke-width", 2);
                    
                    // Add fill for heatmap mode
                    if (isHeatmapMode && componentType === 'attn' && data && data[rowIndex] && data[rowIndex][layerIndex] !== undefined) {
                        attnRect.attr("fill", "red").attr("fill-opacity", data[rowIndex][layerIndex]);
                    } else {
                        attnRect.attr("fill", "white");
                    }
                }

                // MLP components
                if (showMlp || isHeatmapMode) {
                    // MLP in arrow line variables
                    const mlpInX = attnInXEnd + 25;
                    const mlpInYStart = residArrowY;
                    const mlpInYEnd = componentY;

                    // MLP in arrow line
                    g.append("line")
                        .attr("x1", mlpInX)
                        .attr("y1", mlpInYStart)
                        .attr("x2", mlpInX)
                        .attr("y2", mlpInYEnd)
                        .attr("stroke", greenColor)
                        .attr("stroke-width", 2);

                    // MLP out arrow line variables
                    const mlpOutX = attnInXEnd + 125;
                    const mlpOutYStart = componentY;
                    const mlpOutYEnd = residArrowY;

                    // MLP out arrow line
                    g.append("line")
                        .attr("x1", mlpOutX)
                        .attr("y1", mlpOutYStart)
                        .attr("x2", mlpOutX)
                        .attr("y2", mlpOutYEnd)
                        .attr("stroke", greenColor)
                        .attr("stroke-width", 2);

                    // MLP out arrow connecting the MLP information back to the residual stream
                    g.append("path")
                        .attr("d", `M ${mlpOutX - arrowHeadSize / 2} ${mlpOutYEnd + arrowHeadSize} L ${mlpOutX} ${mlpOutYEnd} L ${mlpOutX + arrowHeadSize / 2} ${mlpOutYEnd + arrowHeadSize} Z`)
                        .attr("fill", greenColor);

                    // Line visually bridging the MLP-in and MLP-out arrows
                    g.append("line")
                        .attr("x1", mlpInX)
                        .attr("y1", mlpInYEnd)
                        .attr("x2", mlpOutX)
                        .attr("y2", mlpOutYStart)
                        .attr("stroke", greenColor)
                        .attr("stroke-width", 2);

                    // MLP diamond
                    const mlpWidth = 20;
                    const mlpHeight = 20;
                    // Offset is distance between in and out lines, minus half the width of the square
                    const mlpOffset = ((mlpOutX - mlpInX) / 2) - (mlpWidth / 2);
                    const mlpX = mlpInX + mlpOffset;
                    const mlpY = centerY + residInRadius + (25 - mlpHeight / 2);

                    const mlpRect = g.append("rect")
                        .attr("x", mlpX)
                        .attr("y", mlpY)
                        .attr("width", mlpWidth)
                        .attr("height", mlpHeight)
                        .attr("stroke", greenColor)
                        .attr("stroke-width", 2)
                        .attr("transform", `rotate(45, ${mlpX + mlpWidth / 2}, ${mlpY + mlpHeight / 2})`);
                    
                    // Add fill for heatmap mode
                    if (isHeatmapMode && componentType === 'mlp' && data && data[rowIndex] && data[rowIndex][layerIndex] !== undefined) {
                        mlpRect.attr("fill", "green").attr("fill-opacity", data[rowIndex][layerIndex]);
                    } else {
                        mlpRect.attr("fill", "white");
                    }
                }
            };

            // Draw all token rows for this layer
            for (let i = 0; i < effectiveNumTokens; i++) {
                drawTokenRow(i);
            }
        };

        // Draw all layers
        for (let i = 0; i < effectiveNumLayers; i++) {
            drawLayer(i);
        }

    }, [numTokens, numLayers, showAttn, showMlp, componentType, data]);

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

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 border">
            {!isHeatmapMode && (
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
                                    onChange={(e) => setTestComponentType(e.target.value as 'attn' | 'mlp' | 'resid')}
                                    className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="attn">Attention</option>
                                    <option value="mlp">MLP</option>
                                    <option value="resid">Residual</option>
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
                </div>
            )}
            <svg ref={svgRef}></svg>
        </div>
    );
}