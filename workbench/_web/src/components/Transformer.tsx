"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

interface SelectedComponent {
    tokenIndex: number;
    layerIndex: number;
    componentType: 'resid' | 'attn' | 'mlp' | 'embed' | 'unembed';
}

interface TransformerProps {
    componentType?: 'attn' | 'mlp' | 'resid';
    data?: number[][];
    numTokens?: number;
    numLayers?: number;
    showAttn?: boolean;
    showMlp?: boolean;
    scale?: number;
    tokenLabels?: string[];
    unembedLabels?: string[];
    enableDataFlowHover?: boolean;
    selectedComponent?: SelectedComponent;
}

export default function Transformer({ 
    componentType, 
    data,
    numTokens = 2,
    numLayers = 2,
    showAttn = true,
    showMlp = true,
    scale = 1,
    tokenLabels,
    unembedLabels,
    enableDataFlowHover = false,
    selectedComponent
}: TransformerProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoveredComponent, setHoveredComponent] = useState<SelectedComponent | null>(null);
    
    // Function to get all components that should be highlighted for a given selection
    const getDataFlowComponents = (
        selected: SelectedComponent,
    ): Set<string> => {
        const highlighted = new Set<string>();
        
        const { tokenIndex, layerIndex, componentType } = selected;
        
        // Embed components have no dependencies
        if (componentType === 'embed') {
            highlighted.add(`embed-${tokenIndex}`);
            return highlighted;
        }
        
        // Unembed components see everything
        if (componentType === 'unembed') {
            for (let t = 0; t <= tokenIndex; t++) {
                for (let l = 0; l < layerIndex; l++) {
                    highlighted.add(`resid-circle-${t}-${l}`);
                    highlighted.add(`resid-arrow-${t}-${l}`);
                    highlighted.add(`cross-token-attn-${t}-${l}`);
                    if (showAttn) highlighted.add(`attn-${t}-${l}`);
                    if (showMlp) highlighted.add(`mlp-${t}-${l}`);
                }

                // Highlight resid circles and cross-token attn for the curent layer
                highlighted.add(`resid-circle-${t}-${layerIndex}`);
                highlighted.add(`cross-token-attn-${t}-${layerIndex}`);

                // Highlight the current token's components
                highlighted.add(`resid-arrow-${tokenIndex}-${layerIndex}`);
                if (showAttn) highlighted.add(`attn-${tokenIndex}-${layerIndex}`);
                if (showMlp) highlighted.add(`mlp-${tokenIndex}-${layerIndex}`);

                // Highlight the embed components up to the current token
                highlighted.add(`embed-${t}`);
            }
            highlighted.add(`unembed-${tokenIndex}`);
            return highlighted;
        }
        
        // For residual components
        if (componentType === 'resid') {
            // Add all previous layers
            for (let l = 0; l < layerIndex; l++) {
                if (l === layerIndex - 1) {
                    // Layer L-1: only components at the current token
                    highlighted.add(`resid-circle-${tokenIndex}-${l}`);
                    highlighted.add(`resid-arrow-${tokenIndex}-${l}`);
                    highlighted.add(`embed-${tokenIndex}`);
                    highlighted.add(`cross-token-attn-${tokenIndex}-${l}`);
                    if (showAttn) highlighted.add(`attn-${tokenIndex}-${l}`);
                    if (showMlp) highlighted.add(`mlp-${tokenIndex}-${l}`);
                } else {
                    // Layers 0 to L-2: all components at tokens 0 through current token (causal)
                    for (let t = 0; t <= tokenIndex; t++) {
                        highlighted.add(`resid-circle-${t}-${l}`);
                        highlighted.add(`resid-arrow-${t}-${l}`);
                        highlighted.add(`embed-${t}`);
                        highlighted.add(`cross-token-attn-${t}-${l}`);
                        if (showAttn) highlighted.add(`attn-${t}-${l}`);
                        if (showMlp) highlighted.add(`mlp-${t}-${l}`);
                    }
                }
            }

            // Add current position components
            highlighted.add(`resid-circle-${tokenIndex}-${layerIndex}`);
            highlighted.add(`resid-arrow-${tokenIndex}-${layerIndex}`);
        }
        
        // For attention and MLP components: add all components in previous layers (all tokens)
        if (componentType === 'attn' || componentType === 'mlp') {
            for (let l = 0; l < layerIndex; l++) {
                for (let t = 0; t <= tokenIndex; t++) {
                    highlighted.add(`resid-circle-${t}-${l}`);
                    highlighted.add(`resid-arrow-${t}-${l}`);
                    highlighted.add(`embed-${t}`);
                    highlighted.add(`cross-token-attn-${t}-${l}`);
                    if (showAttn) highlighted.add(`attn-${t}-${l}`);
                    if (showMlp) highlighted.add(`mlp-${t}-${l}`);
                }
            }
        }
        
        // For attention and MLP: add residual circles in current layer for previous tokens
        if (componentType === 'attn' || componentType === 'mlp') {
            for (let t = 0; t <= tokenIndex; t++) {
                highlighted.add(`resid-circle-${t}-${layerIndex}`);
            }
            // // Add the residual circle at the current token position
            highlighted.add(`resid-arrow-${tokenIndex}-${layerIndex}`);
            
            // Add cross-token attention components to the current token
            for (let t = 0; t <= tokenIndex; t++) {
                highlighted.add(`cross-token-attn-${t}-${layerIndex}`);
            }
        }
        
        // For MLP: also add the attention component at the same position
        if (componentType === 'mlp' && showAttn) {
            highlighted.add(`attn-${tokenIndex}-${layerIndex}`);
            highlighted.add(`mlp-${tokenIndex}-${layerIndex}`);
        }
        
        // For attention: include the attention component itself
        if (componentType === 'attn') {
            highlighted.add(`attn-${tokenIndex}-${layerIndex}`);
        }


        return highlighted;
    };

    useEffect(() => {
        if (!svgRef.current) return;

        // Detect heatmap mode
        const isHeatmapMode = componentType !== undefined && data !== undefined;
        
        // Use data dimensions if in heatmap mode
        const effectiveNumTokens = isHeatmapMode && data ? data.length : numTokens;
        const effectiveNumLayers = isHeatmapMode && data && data[0] ? data[0].length : numLayers;
        
        // Determine which component is currently selected (either from prop or hover)
        const activeComponent = hoveredComponent || selectedComponent;
        
        // Get the set of components that should be highlighted
        const highlightedComponents = activeComponent 
            ? getDataFlowComponents(activeComponent)
            : null;

        // Clear any existing content
        d3.select(svgRef.current).selectAll("*").remove();

        const svg = d3.select(svgRef.current);
        const layerWidth = 275;
        const embedWidth = 75; // Space for embed component
        const unembedWidth = 75; // Space for unembed component
        const labelPadding = tokenLabels ? 60 : 0; // Extra space for y-axis labels
        const rightLabelPadding = unembedLabels ? 80 : 0; // Extra space for unembed labels
        const baseWidth = labelPadding + embedWidth + effectiveNumLayers * layerWidth + unembedWidth + rightLabelPadding + 200;
        const rowHeight = 75;
        const baseHeight = effectiveNumTokens * rowHeight + 100;
        const startX = 100 + embedWidth + labelPadding; // Shift start to make room for embed and labels
        const startY = 75;

        // Set SVG dimensions with scale
        svg.attr("width", baseWidth * scale).attr("height", baseHeight * scale);
        
        // Add background rect to capture mouse events on empty space
        if (enableDataFlowHover) {
            svg.append("rect")
                .attr("width", baseWidth * scale)
                .attr("height", baseHeight * scale)
                .attr("fill", "transparent")
                .style("cursor", "default")
                .on("mouseenter", () => {
                    setHoveredComponent(null);
                });
        }

        // Create a group for the visualization with scale transform
        const g = svg.append("g").attr("transform", `scale(${scale})`);
        
        // Define colors
        const greyColor = "#9CA3AF";
        
        // Helper function to get color based on component highlighting
        const getComponentColor = (componentId: string, defaultColor: string): string => {
            if (isHeatmapMode) return greyColor;
            if (!highlightedComponents) return defaultColor;
            return highlightedComponents.has(componentId) ? defaultColor : greyColor;
        };

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
                const residCircleId = `resid-circle-${rowIndex}-${layerIndex}`;
                const residArrowId = `resid-arrow-${rowIndex}-${layerIndex}`;
                const residColor = getComponentColor(residCircleId, "purple");
                
                const residCircle = g.append("circle")
                    .attr("cx", centerX)
                    .attr("cy", centerY)
                    .attr("r", residInRadius)
                    .attr("stroke", residColor)
                    .attr("stroke-width", 2)
                    .attr("data-component-type", "resid")
                    .attr("data-component-subtype", "resid-circle")
                    .attr("data-token-index", rowIndex)
                    .attr("data-layer-index", layerIndex)
                    .attr("data-component-id", residCircleId)
                    .style("cursor", enableDataFlowHover ? "pointer" : "default");
                
                // Add fill for heatmap mode
                if (isHeatmapMode && componentType === 'resid' && data && data[rowIndex] && data[rowIndex][layerIndex] !== undefined) {
                    residCircle.attr("fill", "purple").attr("fill-opacity", data[rowIndex][layerIndex]);
                } else {
                    residCircle.attr("fill", "white");
                }
                
                // Add hover handlers
                if (enableDataFlowHover) {
                    residCircle
                        .on("mouseover", () => {
                            setHoveredComponent({
                                tokenIndex: rowIndex,
                                layerIndex: layerIndex,
                                componentType: 'resid'
                            });
                        })
                        .on("mouseout", () => {
                            setHoveredComponent(null);
                        });
                }

                // Residual arrow that components within the layer (attn, mlp) add to
                const residArrowStartX = centerX + residInRadius;
                const residArrowEndX = centerX + residInRadius + 240;
                const residArrowY = centerY;

                // If not the last layer, connect to the next layer's circle minus its radius
                // If last layer, keep the same arrow length (use residArrowEndX)
                const actualResidArrowEndX = isLastLayer ? residArrowEndX : layerStartX + layerWidth - residInRadius;

                // Residual arrow color: use standard component color logic
                const residArrowColor = getComponentColor(residArrowId, "purple");

                // Residual arrow line
                g.append("line")
                    .attr("x1", residArrowStartX)
                    .attr("y1", residArrowY)
                    .attr("x2", actualResidArrowEndX)
                    .attr("y2", residArrowY)
                    .attr("stroke", residArrowColor)
                    .attr("stroke-width", 2)
                    .attr("data-component-type", "resid")
                    .attr("data-component-subtype", "resid-arrow")
                    .attr("data-token-index", rowIndex)
                    .attr("data-layer-index", layerIndex)
                    .attr("data-component-id", residArrowId);

                // Residual arrow head (for all layers)
                const arrowHeadSize = 10;
                const arrowHeadX = isLastLayer ? residArrowEndX : actualResidArrowEndX;
                g.append("path")
                    .attr("d", `M ${arrowHeadX - arrowHeadSize} ${residArrowY - arrowHeadSize / 2} L ${arrowHeadX} ${residArrowY} L ${arrowHeadX - arrowHeadSize} ${residArrowY + arrowHeadSize / 2} Z`)
                    .attr("fill", residArrowColor)
                    .attr("data-component-type", "resid")
                    .attr("data-component-subtype", "resid-arrow")
                    .attr("data-token-index", rowIndex)
                    .attr("data-layer-index", layerIndex)
                    .attr("data-component-id", residArrowId);

                // A semi-circle path around the residual-in circle (only if not the first row)
                const attnCrossTokenRadius = 20;
                const attnComponentId = `attn-${rowIndex}-${layerIndex}`;
                const attnColor = getComponentColor(attnComponentId, "red");
                
                // For cross-token attention arrows, check if they're part of a highlighted attention/MLP's data flow
                const getCrossTokenColor = (currentRowIndex: number): string => {
                    if (isHeatmapMode) return greyColor;
                    if (!highlightedComponents) return "red";
                    
                    // Check if the cross-token components are explicitly highlighted
                    const crossTokenId = `cross-token-attn-${currentRowIndex}-${layerIndex}`;
                    
                    if (highlightedComponents.has(crossTokenId)) {
                        return "red";
                    }
                    
                    return greyColor;
                };
                
                if ((showAttn || isHeatmapMode) && !isFirstRow) {
                    const attnCrossTokenRoundedPath = `M ${centerX} ${centerY - attnCrossTokenRadius} A ${attnCrossTokenRadius} ${attnCrossTokenRadius} 0 0 1 ${centerX} ${centerY + attnCrossTokenRadius}`;
                    // This semicircle is at the current row and connects to this row's attention
                    const crossTokenId = `cross-token-attn-${rowIndex}-${layerIndex}`;
                    const crossTokenColor = getCrossTokenColor(rowIndex);

                    g.append("path")
                        .attr("d", attnCrossTokenRoundedPath)
                        .attr("fill", "none")
                        .attr("stroke", crossTokenColor)
                        .attr("stroke-width", 2)
                        .attr("data-component-type", "cross-token")
                        .attr("data-component-subtype", "semicircle")
                        .attr("data-token-index", rowIndex)
                        .attr("data-layer-index", layerIndex)
                        .attr("data-component-id", crossTokenId);
                }

                // Arrow that continues the connection to the next token
                if ((showAttn || isHeatmapMode) && !isLastRow) {
                    const attnCrossTokenX = centerX;
                    const attnCrossTokenStartY = centerY + residInRadius;
                    const nextRowCenterY = startY + (rowIndex + 1) * rowHeight;
                    const attnCrossTokenEndY = nextRowCenterY - attnCrossTokenRadius;
                    const crossTokenColor = getCrossTokenColor(rowIndex);

                    // Cross token arrow line
                    const crossTokenId = `cross-token-attn-${rowIndex}-${layerIndex}`;
                    g.append("line")
                        .attr("x1", attnCrossTokenX)
                        .attr("y1", attnCrossTokenStartY)
                        .attr("x2", attnCrossTokenX)
                        .attr("y2", attnCrossTokenEndY)
                        .attr("stroke", crossTokenColor)
                        .attr("stroke-width", 2)
                        .attr("data-component-type", "cross-token")
                        .attr("data-component-subtype", "arrow")
                        .attr("data-token-index", rowIndex)
                        .attr("data-layer-index", layerIndex)
                        .attr("data-component-id", crossTokenId);

                    // Cross token arrow head (pointing down, at the end of the line)
                    g.append("path")
                        .attr("d", `M ${attnCrossTokenX - arrowHeadSize / 2} ${attnCrossTokenEndY - arrowHeadSize} L ${attnCrossTokenX} ${attnCrossTokenEndY} L ${attnCrossTokenX + arrowHeadSize / 2} ${attnCrossTokenEndY - arrowHeadSize} Z`)
                        .attr("fill", crossTokenColor)
                        .attr("data-component-type", "cross-token")
                        .attr("data-component-subtype", "arrow-head")
                        .attr("data-token-index", rowIndex)
                        .attr("data-layer-index", layerIndex)
                        .attr("data-component-id", crossTokenId);
                } else if (showAttn || isHeatmapMode) {
                    // If the last row, we need to draw a cross token arrow that just goes from resid-in to the y level of attn-in
                    const attnCrossTokenX = centerX;
                    const attnCrossTokenStartY = centerY + residInRadius;
                    const attnCrossTokenEndY = centerY + residInRadius + 25;
                    const crossTokenColor = getCrossTokenColor(rowIndex);

                    // Cross token arrow line (last row case)
                    const crossTokenId = `cross-token-attn-${rowIndex}-${layerIndex}`;
                    g.append("line")
                        .attr("x1", attnCrossTokenX)
                        .attr("y1", attnCrossTokenStartY)
                        .attr("x2", attnCrossTokenX)
                        .attr("y2", attnCrossTokenEndY)
                        .attr("stroke", crossTokenColor)
                        .attr("stroke-width", 2)
                        .attr("data-component-type", "cross-token")
                        .attr("data-component-subtype", "arrow")
                        .attr("data-token-index", rowIndex)
                        .attr("data-layer-index", layerIndex)
                        .attr("data-component-id", crossTokenId);

                    // Cross token arrow head (pointing down, at the end of the line)
                    g.append("path")
                        .attr("d", `M ${attnCrossTokenX - arrowHeadSize / 2} ${attnCrossTokenEndY - arrowHeadSize} L ${attnCrossTokenX} ${attnCrossTokenEndY} L ${attnCrossTokenX + arrowHeadSize / 2} ${attnCrossTokenEndY - arrowHeadSize} Z`)
                        .attr("fill", crossTokenColor)
                        .attr("data-component-type", "cross-token")
                        .attr("data-component-subtype", "arrow-head")
                        .attr("data-token-index", rowIndex)
                        .attr("data-layer-index", layerIndex)
                        .attr("data-component-id", crossTokenId);
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
                        .attr("stroke", attnColor)
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
                        .attr("stroke", attnColor)
                        .attr("stroke-width", 2);

                    // Attn out arrow head (pointing up, at the end of the line)
                    g.append("path")
                        .attr("d", `M ${attnOutX - arrowHeadSize / 2} ${attnOutYEnd + arrowHeadSize} L ${attnOutX} ${attnOutYEnd} L ${attnOutX + arrowHeadSize / 2} ${attnOutYEnd + arrowHeadSize} Z`)
                        .attr("fill", attnColor);

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
                        .attr("stroke", attnColor)
                        .attr("stroke-width", 2)
                        .attr("data-component-type", "attn")
                        .attr("data-token-index", rowIndex)
                        .attr("data-layer-index", layerIndex)
                        .attr("data-component-id", attnComponentId)
                        .style("cursor", enableDataFlowHover ? "pointer" : "default");
                    
                    // Add fill for heatmap mode
                    if (isHeatmapMode && componentType === 'attn' && data && data[rowIndex] && data[rowIndex][layerIndex] !== undefined) {
                        attnRect.attr("fill", "red").attr("fill-opacity", data[rowIndex][layerIndex]);
                    } else {
                        attnRect.attr("fill", "white");
                    }
                    
                    // Add hover handlers
                    if (enableDataFlowHover) {
                        attnRect
                            .on("mouseover", () => {
                                setHoveredComponent({
                                    tokenIndex: rowIndex,
                                    layerIndex: layerIndex,
                                    componentType: 'attn'
                                });
                            })
                            .on("mouseout", () => {
                                setHoveredComponent(null);
                            });
                    }
                }

                // MLP components
                if (showMlp || isHeatmapMode) {
                    const mlpComponentId = `mlp-${rowIndex}-${layerIndex}`;
                    const mlpColor = getComponentColor(mlpComponentId, "green");
                    
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
                        .attr("stroke", mlpColor)
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
                        .attr("stroke", mlpColor)
                        .attr("stroke-width", 2);

                    // MLP out arrow connecting the MLP information back to the residual stream
                    g.append("path")
                        .attr("d", `M ${mlpOutX - arrowHeadSize / 2} ${mlpOutYEnd + arrowHeadSize} L ${mlpOutX} ${mlpOutYEnd} L ${mlpOutX + arrowHeadSize / 2} ${mlpOutYEnd + arrowHeadSize} Z`)
                        .attr("fill", mlpColor);

                    // Line visually bridging the MLP-in and MLP-out arrows
                    g.append("line")
                        .attr("x1", mlpInX)
                        .attr("y1", mlpInYEnd)
                        .attr("x2", mlpOutX)
                        .attr("y2", mlpOutYStart)
                        .attr("stroke", mlpColor)
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
                        .attr("stroke", mlpColor)
                        .attr("stroke-width", 2)
                        .attr("transform", `rotate(45, ${mlpX + mlpWidth / 2}, ${mlpY + mlpHeight / 2})`)
                        .attr("data-component-type", "mlp")
                        .attr("data-token-index", rowIndex)
                        .attr("data-layer-index", layerIndex)
                        .attr("data-component-id", mlpComponentId)
                        .style("cursor", enableDataFlowHover ? "pointer" : "default");
                    
                    // Add fill for heatmap mode
                    if (isHeatmapMode && componentType === 'mlp' && data && data[rowIndex] && data[rowIndex][layerIndex] !== undefined) {
                        mlpRect.attr("fill", "green").attr("fill-opacity", data[rowIndex][layerIndex]);
                    } else {
                        mlpRect.attr("fill", "white");
                    }
                    
                    // Add hover handlers
                    if (enableDataFlowHover) {
                        mlpRect
                            .on("mouseover", () => {
                                setHoveredComponent({
                                    tokenIndex: rowIndex,
                                    layerIndex: layerIndex,
                                    componentType: 'mlp'
                                });
                            })
                            .on("mouseout", () => {
                                setHoveredComponent(null);
                            });
                    }
                }
            };

            // Draw all token rows for this layer
            for (let i = 0; i < effectiveNumTokens; i++) {
                drawTokenRow(i);
            }
        };

        // Draw embed component (input side)
        const drawEmbed = () => {
            const trapezoidHeight = 20;
            const narrowWidth = 10;
            const wideWidth = 20;
            const embedX = startX - embedWidth + 20; // Position before first layer
            
            // Draw for each token
            for (let tokenIndex = 0; tokenIndex < effectiveNumTokens; tokenIndex++) {
                const embedY = startY + tokenIndex * rowHeight;
                const embedComponentId = `embed-${tokenIndex}`;
                const embedColor = getComponentColor(embedComponentId, "#3B82F6");
                
                // Draw trapezoid (wider side facing right)
                // Start from top-left, go clockwise
                const trapezoidPath = `
                    M ${embedX} ${embedY - narrowWidth/2}
                    L ${embedX + trapezoidHeight} ${embedY - wideWidth/2}
                    L ${embedX + trapezoidHeight} ${embedY + wideWidth/2}
                    L ${embedX} ${embedY + narrowWidth/2}
                    Z
                `;
                
                const embedShape = g.append("path")
                    .attr("d", trapezoidPath)
                    .attr("stroke", embedColor)
                    .attr("stroke-width", 2)
                    .attr("data-component-type", "embed")
                    .attr("data-token-index", tokenIndex)
                    .attr("data-component-id", embedComponentId)
                    .style("cursor", enableDataFlowHover ? "pointer" : "default");
                
                // Always white fill (no heatmap for embed)
                embedShape.attr("fill", "white");
                
                // Add hover handlers
                if (enableDataFlowHover) {
                    embedShape
                        .on("mouseover", () => {
                            setHoveredComponent({
                                tokenIndex: tokenIndex,
                                layerIndex: 0,
                                componentType: 'embed'
                            });
                        })
                        .on("mouseout", () => {
                            setHoveredComponent(null);
                        });
                }
                
                // Arrow from embed to first residual circle
                const arrowStartX = embedX + trapezoidHeight;
                const arrowEndX = startX - 10; // Stop before the residual circle radius
                const arrowY = embedY;
                
                g.append("line")
                    .attr("x1", arrowStartX)
                    .attr("y1", arrowY)
                    .attr("x2", arrowEndX)
                    .attr("y2", arrowY)
                    .attr("stroke", embedColor)
                    .attr("stroke-width", 2);
                
                // Arrow head
                const arrowHeadSize = 10;
                g.append("path")
                    .attr("d", `M ${arrowEndX - arrowHeadSize} ${arrowY - arrowHeadSize / 2} L ${arrowEndX} ${arrowY} L ${arrowEndX - arrowHeadSize} ${arrowY + arrowHeadSize / 2} Z`)
                    .attr("fill", embedColor);
            }
        };
        
        // Draw unembed component (output side)
        const drawUnembed = () => {
            const trapezoidHeight = 20;
            const narrowWidth = 10;
            const wideWidth = 20;
            // Position unembed at the end of the residual arrow (where it normally would end)
            const lastLayerCenterX = startX + (effectiveNumLayers - 1) * layerWidth;
            const unembedX = lastLayerCenterX + 10 + 240; // residInRadius + residual arrow length
            
            // Draw for each token
            for (let tokenIndex = 0; tokenIndex < effectiveNumTokens; tokenIndex++) {
                const unembedY = startY + tokenIndex * rowHeight;
                const unembedComponentId = `unembed-${tokenIndex}`;
                const unembedColor = getComponentColor(unembedComponentId, "#3B82F6");
                
                // Draw trapezoid (wider side facing left)
                // Start from top-left, go clockwise
                const trapezoidPath = `
                    M ${unembedX} ${unembedY - wideWidth/2}
                    L ${unembedX + trapezoidHeight} ${unembedY - narrowWidth/2}
                    L ${unembedX + trapezoidHeight} ${unembedY + narrowWidth/2}
                    L ${unembedX} ${unembedY + wideWidth/2}
                    Z
                `;
                
                const unembedShape = g.append("path")
                    .attr("d", trapezoidPath)
                    .attr("stroke", unembedColor)
                    .attr("stroke-width", 2)
                    .attr("data-component-type", "unembed")
                    .attr("data-token-index", tokenIndex)
                    .attr("data-component-id", unembedComponentId)
                    .style("cursor", enableDataFlowHover ? "pointer" : "default");
                
                // Always white fill (no heatmap for unembed)
                unembedShape.attr("fill", "white");
                
                // Add hover handlers
                if (enableDataFlowHover) {
                    unembedShape
                        .on("mouseover", () => {
                            setHoveredComponent({
                                tokenIndex: tokenIndex,
                                layerIndex: effectiveNumLayers - 1,
                                componentType: 'unembed'
                            });
                        })
                        .on("mouseout", () => {
                            setHoveredComponent(null);
                        });
                }
            }
        };
        
        // Draw embed component
        drawEmbed();
        
        // Draw all layers
        for (let i = 0; i < effectiveNumLayers; i++) {
            drawLayer(i);
        }
        
        // Draw unembed component
        drawUnembed();
        
        // Draw token labels (y-axis)
        if (tokenLabels && tokenLabels.length > 0) {
            for (let i = 0; i < effectiveNumTokens && i < tokenLabels.length; i++) {
                const labelY = startY + i * rowHeight;
                const labelX = startX - embedWidth - 10; // Position to the left of embed
                
                g.append("text")
                    .attr("x", labelX)
                    .attr("y", labelY)
                    .attr("text-anchor", "end")
                    .attr("dominant-baseline", "middle")
                    .attr("font-size", "14px")
                    .attr("fill", "#374151")
                    .text(tokenLabels[i]);
            }
        }
        
        // Draw unembed labels (right side)
        if (unembedLabels && unembedLabels.length > 0) {
            const lastLayerCenterX = startX + (effectiveNumLayers - 1) * layerWidth;
            const unembedX = lastLayerCenterX + 10 + 240;
            
            for (let i = 0; i < effectiveNumTokens && i < unembedLabels.length; i++) {
                const labelY = startY + i * rowHeight;
                const labelX = unembedX + 30; // Position to the right of unembed
                
                g.append("text")
                    .attr("x", labelX)
                    .attr("y", labelY)
                    .attr("text-anchor", "start")
                    .attr("dominant-baseline", "middle")
                    .attr("font-size", "14px")
                    .attr("fill", "#374151")
                    .text(unembedLabels[i]);
            }
        }

    }, [numTokens, numLayers, showAttn, showMlp, componentType, data, scale, tokenLabels, unembedLabels, hoveredComponent, selectedComponent, enableDataFlowHover]);

    return (
        <div 
            ref={containerRef}
            className="border border-gray-300 rounded-lg overflow-auto"
            style={{ 
                maxWidth: '90vw', 
                maxHeight: '70vh',
                width: scale < 1 ? 'auto' : '90vw',
                height: scale < 1 ? 'auto' : '70vh'
            }}
            onMouseLeave={() => {
                if (enableDataFlowHover) {
                    setHoveredComponent(null);
                }
            }}
        >
            <svg ref={svgRef}></svg>
        </div>
    );
}