"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export default function Page() {
    const svgRef = useRef<SVGSVGElement>(null);
    const [numTokens, setNumTokens] = useState(2);
    const [numLayers, setNumLayers] = useState(2);

    useEffect(() => {
        if (!svgRef.current) return;

        // Clear any existing content
        d3.select(svgRef.current).selectAll("*").remove();

        const svg = d3.select(svgRef.current);
        const layerWidth = 300;
        const width = numLayers * layerWidth + 200;
        const rowHeight = 150;
        const height = numTokens * rowHeight + 100;
        const startX = 100;
        const startY = 75;

        // Set SVG dimensions
        svg.attr("width", width).attr("height", height);

        // Create a group for the visualization
        const g = svg.append("g");

        // Function to draw a single layer
        const drawLayer = (layerIndex: number) => {
            const layerStartX = startX + layerIndex * layerWidth;
            const isLastLayer = layerIndex === numLayers - 1;

            // Function to draw a single token row within a layer
            const drawTokenRow = (rowIndex: number) => {
                const centerX = layerStartX;
                const centerY = startY + rowIndex * rowHeight;
                const isFirstRow = rowIndex === 0;
                const isLastRow = rowIndex === numTokens - 1;

                // Residual-in circle
                const residInRadius = 15;
                g.append("circle")
                    .attr("cx", centerX)
                    .attr("cy", centerY)
                    .attr("r", residInRadius)
                    .attr("fill", "none")
                    .attr("stroke", "purple")
                    .attr("stroke-width", 2);

                // Residual arrow that components within the layer (attn, mlp) add to
                const residArrowStartX = centerX + residInRadius;
                const residArrowEndX = centerX + residInRadius + 240;
                const residArrowY = centerY;

                // If not the last layer, connect to the next layer
                const actualResidArrowEndX = isLastLayer ? residArrowEndX : layerStartX + layerWidth;

                // Residual arrow line
                g.append("line")
                    .attr("x1", residArrowStartX)
                    .attr("y1", residArrowY)
                    .attr("x2", actualResidArrowEndX)
                    .attr("y2", residArrowY)
                    .attr("stroke", "purple")
                    .attr("stroke-width", 2);

                // Residual arrow head (only if last layer)
                if (isLastLayer) {
                    const arrowHeadSize = 10;
                    g.append("path")
                        .attr("d", `M ${residArrowEndX - arrowHeadSize} ${residArrowY - arrowHeadSize / 2} L ${residArrowEndX} ${residArrowY} L ${residArrowEndX - arrowHeadSize} ${residArrowY + arrowHeadSize / 2} Z`)
                        .attr("fill", "purple");
                }

                // A semi-circle path around the residual-in circle (only if not the first row)
                const attnCrossTokenRadius = 25;
                if (!isFirstRow) {
                    const attnCrossTokenRoundedPath = `M ${centerX} ${centerY - attnCrossTokenRadius} A ${attnCrossTokenRadius} ${attnCrossTokenRadius} 0 0 1 ${centerX} ${centerY + attnCrossTokenRadius}`;

                    g.append("path")
                        .attr("d", attnCrossTokenRoundedPath)
                        .attr("fill", "none")
                        .attr("stroke", "red")
                        .attr("stroke-width", 2);
                }

                // Arrow that continues the connection to the next token
                const arrowHeadSize = 10;
                if (!isLastRow) {
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
                        .attr("stroke", "red")
                        .attr("stroke-width", 2);

                    // Cross token arrow head (pointing down, at the end of the line)
                    g.append("path")
                        .attr("d", `M ${attnCrossTokenX - arrowHeadSize / 2} ${attnCrossTokenEndY - arrowHeadSize} L ${attnCrossTokenX} ${attnCrossTokenEndY} L ${attnCrossTokenX + arrowHeadSize / 2} ${attnCrossTokenEndY - arrowHeadSize} Z`)
                        .attr("fill", "red");
                } else {
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
                        .attr("stroke", "red")
                        .attr("stroke-width", 2);

                    // Cross token arrow head (pointing down, at the end of the line)
                    g.append("path")
                        .attr("d", `M ${attnCrossTokenX - arrowHeadSize / 2} ${attnCrossTokenEndY - arrowHeadSize} L ${attnCrossTokenX} ${attnCrossTokenEndY} L ${attnCrossTokenX + arrowHeadSize / 2} ${attnCrossTokenEndY - arrowHeadSize} Z`)
                        .attr("fill", "red");
                }

                // Attn in arrow line variables
                const attnInXStart = centerX;
                const attnXEndOffset = 100;
                const attnInXEnd = centerX + attnXEndOffset;
                const componentY = centerY + residInRadius + 25;

                // Attn in arrow line. This connects from the cross token residual information into the attention component
                g.append("line")
                    .attr("x1", attnInXStart)
                    .attr("y1", componentY)
                    .attr("x2", attnInXEnd)
                    .attr("y2", componentY)
                    .attr("stroke", "red")
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
                    .attr("stroke", "red")
                    .attr("stroke-width", 2);

                // Attn out arrow head (pointing up, at the end of the line)
                g.append("path")
                    .attr("d", `M ${attnOutX - arrowHeadSize / 2} ${attnOutYEnd + arrowHeadSize} L ${attnOutX} ${attnOutYEnd} L ${attnOutX + arrowHeadSize / 2} ${attnOutYEnd + arrowHeadSize} Z`)
                    .attr("fill", "red");

                // Attention square
                const attnWidth = 20;
                const attnHeight = 20;
                const attnX = centerX + (attnXEndOffset / 2) - (attnWidth / 2);
                const attnY = centerY + residInRadius + (25 - attnHeight / 2);

                g.append("rect")
                    .attr("x", attnX)
                    .attr("y", attnY)
                    .attr("width", attnWidth)
                    .attr("height", attnHeight)
                    .attr("stroke", "red")
                    .attr("stroke-width", 2)
                    // Fill white so the line beneath is not visible
                    .attr("fill", "white");

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
                    .attr("stroke", "green")
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
                    .attr("stroke", "green")
                    .attr("stroke-width", 2);

                // MLP out arrow connecting the MLP information back to the residual stream
                g.append("path")
                    .attr("d", `M ${mlpOutX - arrowHeadSize / 2} ${mlpOutYEnd + arrowHeadSize} L ${mlpOutX} ${mlpOutYEnd} L ${mlpOutX + arrowHeadSize / 2} ${mlpOutYEnd + arrowHeadSize} Z`)
                    .attr("fill", "green");

                // Line visually bridging the MLP-in and MLP-out arrows
                g.append("line")
                    .attr("x1", mlpInX)
                    .attr("y1", mlpInYEnd)
                    .attr("x2", mlpOutX)
                    .attr("y2", mlpOutYStart)
                    .attr("stroke", "green")
                    .attr("stroke-width", 2);

                // MLP diamond
                const mlpWidth = 20;
                const mlpHeight = 20;
                // Offset is distance between in and out lines, minus half the width of the square
                const mlpOffset = ((mlpOutX - mlpInX) / 2) - (mlpWidth / 2);
                const mlpX = mlpInX + mlpOffset;
                const mlpY = centerY + residInRadius + (25 - mlpHeight / 2);

                g.append("rect")
                    .attr("x", mlpX)
                    .attr("y", mlpY)
                    .attr("width", mlpWidth)
                    .attr("height", mlpHeight)
                    .attr("stroke", "green")
                    .attr("stroke-width", 2)
                    // Fill white so the line beneath is not visible
                    .attr("fill", "white")
                    .attr("transform", `rotate(45, ${mlpX + mlpWidth / 2}, ${mlpY + mlpHeight / 2})`);
            };

            // Draw all token rows for this layer
            for (let i = 0; i < numTokens; i++) {
                drawTokenRow(i);
            }
        };

        // Draw all layers
        for (let i = 0; i < numLayers; i++) {
            drawLayer(i);
        }

    }, [numTokens, numLayers]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 border">
            <div className="mb-4 flex items-center gap-4">
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
            <svg ref={svgRef}></svg>
        </div>
    );
}