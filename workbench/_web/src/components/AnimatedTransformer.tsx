"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

interface AnimatedTransformerProps {
    numTokens?: number;
    numLayers?: number;
    showAttn?: boolean;
    showMlp?: boolean;
    scale?: number;
    tokenLabels?: string[];
    unembedLabels?: string[];
    animationSpeed?: number; // milliseconds per step
}

interface ComponentState {
    opacity: number;
    color: string;
    fillColor?: string;
}

export default function AnimatedTransformer({ 
    numTokens = 2,
    numLayers = 2,
    showAttn = true,
    showMlp = true,
    scale = 1,
    tokenLabels,
    unembedLabels,
    animationSpeed = 300
}: AnimatedTransformerProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [animationState, setAnimationState] = useState({
        currentPhase: 0, // Which rows are being animated
        currentStep: 0,  // Position in the current animation sequence
        progress: 0,     // Progress within current step (0-1)
    });
    const animationFrameRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number>(0);
    
    // Calculate which components should be highlighted and their opacity
    const getComponentStates = (): Map<string, ComponentState> => {
        const states = new Map<string, ComponentState>();
        const { currentPhase, currentStep, progress } = animationState;
        
        // Determine how many rows are animating
        const animatingRows = currentPhase + 1;
        
        // For each animating row
        for (let row = 0; row < animatingRows && row < numTokens; row++) {
            let componentIndex = 0;
            
            // Helper function to set component state
            const setComponentState = (id: string, color: string, fillColor?: string) => {
                if (currentStep > componentIndex) {
                    states.set(id, { opacity: 1, color, fillColor });
                } else if (currentStep === componentIndex) {
                    states.set(id, { opacity: progress, color, fillColor });
                }
            };
            
            // Embed
            setComponentState(`embed-${row}`, "#3B82F6", "#DBEAFE");
            componentIndex++;
            
            // For each layer
            for (let layer = 0; layer < numLayers; layer++) {
                // Residual circle
                setComponentState(`resid-circle-${row}-${layer}`, "purple", "#E9D5FF");
                componentIndex++;
                
                // Cross-token attention (synced with attention)
                if (showAttn) {
                    const attnIndex = componentIndex;
                    if (currentStep > attnIndex) {
                        states.set(`cross-token-attn-${row}-${layer}`, { opacity: 1, color: "red" });
                    } else if (currentStep === attnIndex) {
                        states.set(`cross-token-attn-${row}-${layer}`, { opacity: progress, color: "red" });
                    }
                }
                
                // Attention
                if (showAttn) {
                    setComponentState(`attn-${row}-${layer}`, "red", "#FEE2E2");
                    componentIndex++;
                }
                
                // MLP
                if (showMlp) {
                    setComponentState(`mlp-${row}-${layer}`, "green", "#DCFCE7");
                    componentIndex++;
                }
                
                // Residual arrow
                setComponentState(`resid-arrow-${row}-${layer}`, "purple");
                componentIndex++;
            }
            
            // Unembed
            setComponentState(`unembed-${row}`, "#3B82F6", "#DBEAFE");
        }
        
        return states;
    };

    // Animation loop with smooth transitions
    useEffect(() => {
        const componentsPerLayer = 2 + (showAttn ? 1 : 0) + (showMlp ? 1 : 0);
        const componentsPerToken = 1 + numLayers * componentsPerLayer + 1;
        
        const animate = (currentTime: number) => {
            if (!lastTimeRef.current) lastTimeRef.current = currentTime;
            const deltaTime = currentTime - lastTimeRef.current;
            lastTimeRef.current = currentTime;
            
            setAnimationState(prev => {
                const { currentPhase, currentStep, progress } = prev;
                
                // Calculate new progress
                const newProgress = progress + (deltaTime / animationSpeed);
                
                if (newProgress >= 1) {
                    // Move to next step
                    if (currentStep >= componentsPerToken) {
                        // Move to next phase
                        if (currentPhase + 1 >= numTokens) {
                            // Reset to beginning
                            return { currentPhase: 0, currentStep: 0, progress: 0 };
                        } else {
                            // Start next phase
                            return { currentPhase: currentPhase + 1, currentStep: 0, progress: 0 };
                        }
                    } else {
                        // Continue current phase
                        return { ...prev, currentStep: currentStep + 1, progress: 0 };
                    }
                } else {
                    // Continue current step with updated progress
                    return { ...prev, progress: Math.min(newProgress, 1) };
                }
            });
            
            animationFrameRef.current = requestAnimationFrame(animate);
        };
        
        animationFrameRef.current = requestAnimationFrame(animate);
        
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            lastTimeRef.current = 0;
        };
    }, [numTokens, numLayers, showAttn, showMlp, animationSpeed]);

    useEffect(() => {
        if (!svgRef.current) return;

        const componentStates = getComponentStates();

        // Clear any existing content
        d3.select(svgRef.current).selectAll("*").remove();

        const svg = d3.select(svgRef.current);
        const layerWidth = 210;
        const embedWidth = 75;
        const unembedWidth = 75;
        const labelPadding = tokenLabels ? 60 : 0;
        const rightLabelPadding = unembedLabels ? 80 : 0;
        const baseWidth = labelPadding + embedWidth + numLayers * layerWidth + unembedWidth + rightLabelPadding + 200;
        const rowHeight = 75;
        const baseHeight = numTokens * rowHeight + 100;
        const startX = 100 + embedWidth + labelPadding;
        const startY = 75;

        // Set SVG dimensions with scale
        svg.attr("width", baseWidth * scale).attr("height", baseHeight * scale);

        // Create a group for the visualization with scale transform
        const g = svg.append("g").attr("transform", `scale(${scale})`);
        
        // Define colors
        const greyColor = "#9CA3AF";
        
        // Light colors for fills
        const lightColors = {
            purple: "#E9D5FF",
            red: "#FEE2E2",
            green: "#DCFCE7",
            blue: "#DBEAFE"
        };
        
        // Helper function to interpolate between colors using d3
        const interpolateColor = (color1: string, color2: string, progress: number): string => {
            const interpolator = d3.interpolateRgb(color1, color2);
            return interpolator(progress);
        };
        
        // Helper function to get component style with proper interpolation
        const getComponentStyle = (componentId: string, defaultColor: string): ComponentState => {
            const state = componentStates.get(componentId);
            if (!state) {
                return { opacity: 1, color: greyColor, fillColor: "white" };
            }
            // Interpolate colors based on animation progress
            const color = interpolateColor(greyColor, state.color, state.opacity);
            const fillColor = state.fillColor ? interpolateColor("white", state.fillColor, state.opacity) : "white";
            return { opacity: 1, color, fillColor };
        };

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
                const residInRadius = 10;
                const residCircleId = `resid-circle-${rowIndex}-${layerIndex}`;
                const residArrowId = `resid-arrow-${rowIndex}-${layerIndex}`;
                const residCircleStyle = getComponentStyle(residCircleId, "purple");
                
                const residCircle = g.append("circle")
                    .attr("cx", centerX)
                    .attr("cy", centerY)
                    .attr("r", residInRadius)
                    .attr("stroke", residCircleStyle.color)
                    .attr("stroke-width", 2)
                    .attr("data-component-id", residCircleId);
                
                // Add fill with interpolated color
                residCircle.attr("fill", residCircleStyle.fillColor);

                // Residual arrow
                const residArrowStartX = centerX + residInRadius;
                const residArrowEndX = centerX + residInRadius + 200;
                const residArrowY = centerY;
                const actualResidArrowEndX = isLastLayer ? residArrowEndX : layerStartX + layerWidth - residInRadius;
                
                const residArrowStyle = getComponentStyle(residArrowId, "purple");

                // Residual arrow line
                g.append("line")
                    .attr("x1", residArrowStartX)
                    .attr("y1", residArrowY)
                    .attr("x2", actualResidArrowEndX)
                    .attr("y2", residArrowY)
                    .attr("stroke", residArrowStyle.color)
                    .attr("stroke-width", 2)
                    .attr("data-component-id", residArrowId);

                // Residual arrow head
                const arrowHeadSize = 10;
                const arrowHeadX = isLastLayer ? residArrowEndX : actualResidArrowEndX;
                g.append("path")
                    .attr("d", `M ${arrowHeadX - arrowHeadSize} ${residArrowY - arrowHeadSize / 2} L ${arrowHeadX} ${residArrowY} L ${arrowHeadX - arrowHeadSize} ${residArrowY + arrowHeadSize / 2} Z`)
                    .attr("fill", residArrowStyle.color)
                    .attr("data-component-id", residArrowId);

                // Cross-token attention components
                const attnCrossTokenRadius = 20;
                const attnComponentId = `attn-${rowIndex}-${layerIndex}`;
                const attnStyle = getComponentStyle(attnComponentId, "red");
                const crossTokenStyle = getComponentStyle(`cross-token-attn-${rowIndex}-${layerIndex}`, "red");
                
                if (showAttn && !isFirstRow) {
                    const attnCrossTokenRoundedPath = `M ${centerX} ${centerY - attnCrossTokenRadius} A ${attnCrossTokenRadius} ${attnCrossTokenRadius} 0 0 1 ${centerX} ${centerY + attnCrossTokenRadius}`;
                    const crossTokenId = `cross-token-attn-${rowIndex}-${layerIndex}`;

                    g.append("path")
                        .attr("d", attnCrossTokenRoundedPath)
                        .attr("fill", "none")
                        .attr("stroke", crossTokenStyle.color)
                        .attr("stroke-width", 2)
                        .attr("data-component-id", crossTokenId);
                }

                // Arrow that continues the connection to the next token
                if (showAttn && !isLastRow) {
                    const attnCrossTokenX = centerX;
                    const attnCrossTokenStartY = centerY + residInRadius;
                    const nextRowCenterY = startY + (rowIndex + 1) * rowHeight;
                    const attnCrossTokenEndY = nextRowCenterY - attnCrossTokenRadius;

                    const crossTokenId = `cross-token-attn-${rowIndex}-${layerIndex}`;
                    g.append("line")
                        .attr("x1", attnCrossTokenX)
                        .attr("y1", attnCrossTokenStartY)
                        .attr("x2", attnCrossTokenX)
                        .attr("y2", attnCrossTokenEndY)
                        .attr("stroke", crossTokenStyle.color)
                        .attr("stroke-width", 2)
                        .attr("data-component-id", crossTokenId);

                    // Cross token arrow head
                    g.append("path")
                        .attr("d", `M ${attnCrossTokenX - arrowHeadSize / 2} ${attnCrossTokenEndY - arrowHeadSize} L ${attnCrossTokenX} ${attnCrossTokenEndY} L ${attnCrossTokenX + arrowHeadSize / 2} ${attnCrossTokenEndY - arrowHeadSize} Z`)
                        .attr("fill", crossTokenStyle.color)
                        .attr("data-component-id", crossTokenId);

                } else if (showAttn) {
                    // Last row case
                    const attnCrossTokenX = centerX;
                    const attnCrossTokenStartY = centerY + residInRadius;
                    const attnCrossTokenEndY = centerY + residInRadius + 20;

                    const crossTokenId = `cross-token-attn-${rowIndex}-${layerIndex}`;
                    g.append("line")
                        .attr("x1", attnCrossTokenX)
                        .attr("y1", attnCrossTokenStartY)
                        .attr("x2", attnCrossTokenX)
                        .attr("y2", attnCrossTokenEndY)
                        .attr("stroke", crossTokenStyle.color)
                        .attr("stroke-width", 2)
                        .attr("data-component-id", crossTokenId);
                }

                // Attn components
                const attnInXStart = centerX;
                const attnXEndOffset = 75;
                const attnInXEnd = centerX + attnXEndOffset;
                const componentY = centerY + residInRadius + 20;

                if (showAttn) {
                    const attnColor = attnStyle.color;
                    
                    g.append("line")
                        .attr("x1", attnInXStart)
                        .attr("y1", componentY)
                        .attr("x2", attnInXEnd)
                        .attr("y2", componentY)
                        .attr("stroke", attnColor)
                        .attr("stroke-width", 2)
                        .attr("stroke-width", 2);

                    const attnOutX = attnInXEnd;
                    const attnOutYStart = componentY;
                    const attnOutYEnd = residArrowY;

                    g.append("line")
                        .attr("x1", attnOutX)
                        .attr("y1", attnOutYStart)
                        .attr("x2", attnOutX)
                        .attr("y2", attnOutYEnd)
                        .attr("stroke", attnColor)
                        .attr("stroke-width", 2)
                        .attr("stroke-width", 2);

                    g.append("path")
                        .attr("d", `M ${attnOutX - arrowHeadSize / 2} ${attnOutYEnd + arrowHeadSize} L ${attnOutX} ${attnOutYEnd} L ${attnOutX + arrowHeadSize / 2} ${attnOutYEnd + arrowHeadSize} Z`)
                        .attr("fill", attnColor)
                        .attr("fill", attnColor);

                    // Attention square
                    const attnWidth = 20;
                    const attnHeight = 20;
                    const attnX = centerX + (attnXEndOffset / 2) - (attnWidth / 2);
                    const attnY = componentY - (attnHeight / 2);

                    const attnRect = g.append("rect")
                        .attr("x", attnX)
                        .attr("y", attnY)
                        .attr("width", attnWidth)
                        .attr("height", attnHeight)
                        .attr("stroke", attnColor)
                        .attr("stroke-width", 2)
                        .attr("data-component-id", attnComponentId);
                    
                    attnRect.attr("fill", attnStyle.fillColor);
                }

                // MLP components
                if (showMlp) {
                    const mlpComponentId = `mlp-${rowIndex}-${layerIndex}`;
                    const mlpStyle = getComponentStyle(mlpComponentId, "green");
                    const mlpColor = mlpStyle.color;
                    
                    const mlpInX = attnInXEnd + 25;
                    const mlpInYStart = residArrowY;
                    const mlpInYEnd = componentY;

                    g.append("line")
                        .attr("x1", mlpInX)
                        .attr("y1", mlpInYStart)
                        .attr("x2", mlpInX)
                        .attr("y2", mlpInYEnd)
                        .attr("stroke", mlpColor)
                        .attr("stroke-width", 2)
                        .attr("stroke-width", 2);

                    const mlpOutX = attnInXEnd + 100;
                    const mlpOutYStart = componentY;
                    const mlpOutYEnd = residArrowY;

                    g.append("line")
                        .attr("x1", mlpOutX)
                        .attr("y1", mlpOutYStart)
                        .attr("x2", mlpOutX)
                        .attr("y2", mlpOutYEnd)
                        .attr("stroke", mlpColor)
                        .attr("stroke-width", 2)
                        .attr("stroke-width", 2);

                    g.append("path")
                        .attr("d", `M ${mlpOutX - arrowHeadSize / 2} ${mlpOutYEnd + arrowHeadSize} L ${mlpOutX} ${mlpOutYEnd} L ${mlpOutX + arrowHeadSize / 2} ${mlpOutYEnd + arrowHeadSize} Z`)
                        .attr("fill", mlpColor)
                        .attr("fill", mlpColor);

                    g.append("line")
                        .attr("x1", mlpInX)
                        .attr("y1", mlpInYEnd)
                        .attr("x2", mlpOutX)
                        .attr("y2", mlpOutYStart)
                        .attr("stroke", mlpColor)
                        .attr("stroke-width", 2)
                        .attr("stroke-width", 2);

                    // MLP diamond
                    const mlpWidth = 20;
                    const mlpHeight = 20;
                    const mlpOffset = ((mlpOutX - mlpInX) / 2) - (mlpWidth / 2);
                    const mlpX = mlpInX + mlpOffset;
                    const mlpY = componentY - (mlpHeight / 2);

                    const mlpRect = g.append("rect")
                        .attr("x", mlpX)
                        .attr("y", mlpY)
                        .attr("width", mlpWidth)
                        .attr("height", mlpHeight)
                        .attr("stroke", mlpColor)
                        .attr("stroke-width", 2)
                        .attr("transform", `rotate(45, ${mlpX + mlpWidth / 2}, ${mlpY + mlpHeight / 2})`)
                        .attr("data-component-id", mlpComponentId);
                    
                    mlpRect.attr("fill", mlpStyle.fillColor);
                }
            };

            // Draw all token rows for this layer
            for (let i = 0; i < numTokens; i++) {
                drawTokenRow(i);
            }
        };

        // Draw embed component
        const drawEmbed = () => {
            const trapezoidHeight = 20;
            const narrowWidth = 10;
            const wideWidth = 20;
            const embedX = startX - embedWidth + 20;
            
            for (let tokenIndex = 0; tokenIndex < numTokens; tokenIndex++) {
                const embedY = startY + tokenIndex * rowHeight;
                const embedComponentId = `embed-${tokenIndex}`;
                const embedStyle = getComponentStyle(embedComponentId, "#3B82F6");
                const embedColor = embedStyle.color;
                
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
                    .attr("data-component-id", embedComponentId);
                
                embedShape.attr("fill", embedStyle.fillColor);
                
                // Arrow from embed to first residual circle
                const arrowStartX = embedX + trapezoidHeight;
                const arrowEndX = startX - 10;
                const arrowY = embedY;
                
                g.append("line")
                    .attr("x1", arrowStartX)
                    .attr("y1", arrowY)
                    .attr("x2", arrowEndX)
                    .attr("y2", arrowY)
                    .attr("stroke", embedColor)
                    .attr("stroke-width", 2)
                    .attr("stroke-width", 2);
                
                const arrowHeadSize = 10;
                g.append("path")
                    .attr("d", `M ${arrowEndX - arrowHeadSize} ${arrowY - arrowHeadSize / 2} L ${arrowEndX} ${arrowY} L ${arrowEndX - arrowHeadSize} ${arrowY + arrowHeadSize / 2} Z`)
                    .attr("fill", embedColor)
                    .attr("fill", embedColor);
            }
        };
        
        // Draw unembed component
        const drawUnembed = () => {
            const trapezoidHeight = 20;
            const narrowWidth = 10;
            const wideWidth = 20;
            const lastLayerCenterX = startX + (numLayers - 1) * layerWidth;
            const unembedX = lastLayerCenterX + 10 + 200;
            
            for (let tokenIndex = 0; tokenIndex < numTokens; tokenIndex++) {
                const unembedY = startY + tokenIndex * rowHeight;
                const unembedComponentId = `unembed-${tokenIndex}`;
                const unembedStyle = getComponentStyle(unembedComponentId, "#3B82F6");
                const unembedColor = unembedStyle.color;
                
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
                    .attr("data-component-id", unembedComponentId);
                
                unembedShape.attr("fill", unembedStyle.fillColor);
            }
        };
        
        // Draw labels
        if (tokenLabels && tokenLabels.length > 0) {
            for (let i = 0; i < numTokens && i < tokenLabels.length; i++) {
                const labelY = startY + i * rowHeight;
                const labelX = startX - embedWidth - 10;
                
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
        
        if (unembedLabels && unembedLabels.length > 0) {
            const lastLayerCenterX = startX + (numLayers - 1) * layerWidth;
            const unembedX = lastLayerCenterX + 10 + 220;
            
            for (let i = 0; i < numTokens && i < unembedLabels.length; i++) {
                const labelY = startY + i * rowHeight;
                const labelX = unembedX + 30;
                
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

        // Draw components
        drawEmbed();
        for (let i = 0; i < numLayers; i++) {
            drawLayer(i);
        }
        drawUnembed();

    }, [numTokens, numLayers, showAttn, showMlp, scale, tokenLabels, unembedLabels, animationState]);

    return (
        <div 
            ref={containerRef}
            className="rounded-lg overflow-auto"
            style={{ 
                maxWidth: '90vw', 
                maxHeight: '70vh',
                width: scale < 1 ? 'auto' : '90vw',
                height: scale < 1 ? 'auto' : '70vh'
            }}
        >
            <svg ref={svgRef}></svg>
        </div>
    );
}