"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import { useTheme } from "next-themes";

interface SelectedComponent {
    tokenIndex: number;
    layerIndex: number;
    componentType: 'resid' | 'attn' | 'mlp' | 'embed' | 'unembed';
}

interface LensTransformerProps {
    clickHandler: (tokenIndex: number, layerIndex: number) => void;
    numTokens?: number;
    numLayers?: number;
    showAttn?: boolean;
    showMlp?: boolean;
    scale?: number;
    tokenLabels?: string[];
    unembedLabels?: string[];
    showFlowOnHover?: boolean;
    rowMode?: boolean;
}

// Function to get all components that should be highlighted for a given selection
const getDataFlowComponents = (
    selected: SelectedComponent,
    showAttn: boolean,
    showMlp: boolean,
    numLayers: number,
    rowMode: boolean
): Set<string> => {
    const highlighted = new Set<string>();
    
    const { tokenIndex, layerIndex, componentType } = selected;

    if (rowMode) {
        for (let l = 0; l < numLayers; l++) {
            highlighted.add(`resid-circle-${tokenIndex}-${l}`);
            highlighted.add(`resid-arrow-${tokenIndex}-${l}`);
            highlighted.add(`cross-token-attn-${tokenIndex}-${l}`);
            if (showAttn) highlighted.add(`attn-${tokenIndex}-${l}`);
            if (showMlp) highlighted.add(`mlp-${tokenIndex}-${l}`);
        }
        highlighted.add(`embed-${tokenIndex}`);
        highlighted.add(`unembed-${tokenIndex}`);
        return highlighted;
    }
    
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
            for (let t = 0; t <= tokenIndex; t++) {
                highlighted.add(`resid-circle-${t}-${l}`);
                highlighted.add(`embed-${t}`);
                highlighted.add(`cross-token-attn-${t}-${l}`);

                if (l !== layerIndex - 1) {
                    highlighted.add(`resid-arrow-${t}-${l}`);
                    if (showAttn) highlighted.add(`attn-${t}-${l}`);
                    if (showMlp) highlighted.add(`mlp-${t}-${l}`);
                }
            }
        }

        highlighted.add(`resid-arrow-${tokenIndex}-${layerIndex - 1}`);
        if (showAttn) highlighted.add(`attn-${tokenIndex}-${layerIndex - 1}`);
        if (showMlp) highlighted.add(`mlp-${tokenIndex}-${layerIndex - 1}`);

        highlighted.add(`resid-circle-${tokenIndex}-${layerIndex}`);
        highlighted.add(`resid-arrow-${tokenIndex}-${layerIndex}`);

        if (layerIndex === 0) {
            highlighted.add(`embed-${tokenIndex}`);
        }
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


export default function LensTransformer({ 
    clickHandler,
    numTokens = 2,
    numLayers = 2,
    showAttn = true,
    showMlp = true,
    scale = 1,
    tokenLabels,
    unembedLabels,
    showFlowOnHover = false,
    rowMode = false,
}: LensTransformerProps) {
    const { theme } = useTheme();
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [clickedComponent, setClickedComponent] = useState<SelectedComponent | null>(null);
    const [hoveredComponent, setHoveredComponent] = useState<SelectedComponent | null>(null);
    const [unembedCardPositions, setUnembedCardPositions] = useState<{ x: number; y: number; tokenIndex: number }[]>([]);
    
    const STROKE_BASE = theme === "dark" ? "#374151" : "#E5E7EB";
    const FILL_BASE = theme === "dark" ? "#1F2937" : "#F3F4F6";
    
    // Theme-aware colors
    const COLORS = {
        purple: theme === "dark" ? "#A855F7" : "#8B5CF6",
        red: theme === "dark" ? "#EF4444" : "#DC2626", 
        green: theme === "dark" ? "#22C55E" : "#16A34A",
        blue: theme === "dark" ? "#3B82F6" : "#2563EB",
        fills: {
            purple: theme === "dark" ? "#2D1B69" : "#E9D5FF",
            red: theme === "dark" ? "#7F1D1D" : "#FEE2E2",
            green: theme === "dark" ? "#14532D" : "#DCFCE7",
            blue: theme === "dark" ? "#1E3A8A" : "#DBEAFE"
        }
    };

    // Determine which component is currently selected
    const activeComponent = hoveredComponent || clickedComponent;
    
    // Get the set of components that should be highlighted
    const highlightedComponents = useMemo(() => {
        return activeComponent ? getDataFlowComponents(activeComponent, showAttn, showMlp, numLayers, rowMode) : null;
    }, [activeComponent, showAttn, showMlp, numLayers, rowMode]);

    // SVG dimensions calculation
    const dimensions = useMemo(() => {
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
        
        return {
            layerWidth,
            embedWidth,
            unembedWidth,
            labelPadding,
            rightLabelPadding,
            baseWidth,
            rowHeight,
            baseHeight,
            startX,
            startY
        };
    }, [numLayers, numTokens, tokenLabels, unembedLabels]);


    // Main rendering effect
    useEffect(() => {
        if (!svgRef.current) return;

        // Function to add event handlers to components
        const addComponentHandlers = (
            element: d3.Selection<any, unknown, null, undefined>,
            tokenIndex: number,
            layerIndex: number,
            componentType: 'resid' | 'attn' | 'mlp' | 'embed' | 'unembed'
        ) => {
            element
                .on("mouseenter", () => {
                    setHoveredComponent({
                        tokenIndex,
                        layerIndex,
                        componentType
                    });
                })
                .on("mouseleave", () => {
                    setHoveredComponent(null);
                })
                .on("click", (event) => {
                    event.stopPropagation();
                    setClickedComponent({
                        tokenIndex,
                        layerIndex,
                        componentType
                    });
                    clickHandler(tokenIndex, layerIndex);
                });
        };

        // Clear any existing content
        d3.select(svgRef.current).selectAll("*").remove();

        const svg = d3.select(svgRef.current);
        
        // Set SVG dimensions with scale
        svg.attr("width", dimensions.baseWidth * scale).attr("height", dimensions.baseHeight * scale);
        
        // Add background rect to capture mouse events on empty space
        if (showFlowOnHover) {
            svg.append("rect")
                .attr("width", dimensions.baseWidth * scale)
                .attr("height", dimensions.baseHeight * scale)
                .attr("fill", "transparent")
                .style("cursor", "default")
                .on("mouseenter", () => {
                    setHoveredComponent(null);
                })
                .on("click", (event) => {
                    event.stopPropagation();
                    setClickedComponent(null);
                });
        }

        // Create a group for the visualization with scale transform
        const g = svg.append("g").attr("transform", `scale(${scale})`);
        
        // Function to draw a single layer
        const drawLayer = (layerIndex: number) => {
            const layerStartX = dimensions.startX + layerIndex * dimensions.layerWidth;
            const isLastLayer = layerIndex === numLayers - 1;

            // Function to draw a single token row within a layer
            const drawTokenRow = (rowIndex: number) => {
                const centerX = layerStartX;
                const centerY = dimensions.startY + rowIndex * dimensions.rowHeight;
                const isFirstRow = rowIndex === 0;
                const isLastRow = rowIndex === numTokens - 1;

                // Residual-in circle
                const residInRadius = 10;
                const residCircleId = `resid-circle-${rowIndex}-${layerIndex}`;
                const residArrowId = `resid-arrow-${rowIndex}-${layerIndex}`;
                const residColor = COLORS.purple;
                
                const residCircle = g.append("circle")
                    .attr("cx", centerX)
                    .attr("cy", centerY)
                    .attr("r", residInRadius)
                    .attr("stroke", residColor)
                    .attr("stroke-width", 2)
                    .attr("data-component-type", "resid")
                    .attr("data-component-subtype", "shape")
                    .attr("data-component-id", residCircleId)
                    .attr("fill", COLORS.fills.purple)
                    .style("cursor", showFlowOnHover ? "pointer" : "default");
                
                // Add hover and click handlers
                if (showFlowOnHover) {
                    addComponentHandlers(residCircle, rowIndex, layerIndex, 'resid');
                }

                // Residual arrow that components within the layer (attn, mlp) add to
                const residArrowStartX = centerX + residInRadius;
                const residArrowEndX = centerX + residInRadius + 200;
                const residArrowY = centerY;

                // If not the last layer, connect to the next layer's circle minus its radius
                // If last layer, keep the same arrow length (use residArrowEndX)
                const actualResidArrowEndX = isLastLayer ? residArrowEndX : layerStartX + dimensions.layerWidth - residInRadius;

                // Residual arrow color: use standard component color logic
                const residArrowColor = COLORS.purple;

                // Residual arrow line
                g.append("line")
                    .attr("x1", residArrowStartX)
                    .attr("y1", residArrowY)
                    .attr("x2", actualResidArrowEndX)
                    .attr("y2", residArrowY)
                    .attr("stroke", residArrowColor)
                    .attr("stroke-width", 2)
                    .attr("data-component-type", "resid")
                    .attr("data-component-subtype", "line")
                    .attr("data-component-id", residArrowId);

                // Residual arrow head (for all layers)
                const arrowHeadSize = 10;
                const arrowHeadX = isLastLayer ? residArrowEndX : actualResidArrowEndX;
                g.append("path")
                    .attr("d", `M ${arrowHeadX - arrowHeadSize} ${residArrowY - arrowHeadSize / 2} L ${arrowHeadX} ${residArrowY} L ${arrowHeadX - arrowHeadSize} ${residArrowY + arrowHeadSize / 2} Z`)
                    .attr("fill", residArrowColor)
                    .attr("data-component-type", "resid")
                    .attr("data-component-subtype", "filled")
                    .attr("data-component-id", residArrowId);

                // A semi-circle path around the residual-in circle (only if not the first row)
                const attnCrossTokenRadius = 20;
                const attnComponentId = `attn-${rowIndex}-${layerIndex}`;
                const attnColor = COLORS.red;
                
                // Cross-token arrows use red as default color
                
                if (showAttn && !isFirstRow) {
                    const attnCrossTokenRoundedPath = `M ${centerX} ${centerY - attnCrossTokenRadius} A ${attnCrossTokenRadius} ${attnCrossTokenRadius} 0 0 1 ${centerX} ${centerY + attnCrossTokenRadius}`;
                    // This semicircle is at the current row and connects to this row's attention
                    const crossTokenId = `cross-token-attn-${rowIndex}-${layerIndex}`;
                    const crossTokenColor = COLORS.red;

                    g.append("path")
                        .attr("d", attnCrossTokenRoundedPath)
                        .attr("fill", "none")
                        .attr("stroke", crossTokenColor)
                        .attr("stroke-width", 2)
                        .attr("data-component-type", "cross-token")
                        .attr("data-component-subtype", "line")
                        .attr("data-component-id", crossTokenId);
                }

                // Arrow that continues the connection to the next token
                if (showAttn && !isLastRow) {
                    const attnCrossTokenX = centerX;
                    const attnCrossTokenStartY = centerY + residInRadius;
                    const nextRowCenterY = dimensions.startY + (rowIndex + 1) * dimensions.rowHeight;
                    const attnCrossTokenEndY = nextRowCenterY - attnCrossTokenRadius;
                    const crossTokenColor = COLORS.red;

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
                        .attr("data-component-subtype", "line")
                        .attr("data-component-id", crossTokenId);

                    // Cross token arrow head (pointing down, at the end of the line)
                    g.append("path")
                        .attr("d", `M ${attnCrossTokenX - arrowHeadSize / 2} ${attnCrossTokenEndY - arrowHeadSize} L ${attnCrossTokenX} ${attnCrossTokenEndY} L ${attnCrossTokenX + arrowHeadSize / 2} ${attnCrossTokenEndY - arrowHeadSize} Z`)
                        .attr("fill", crossTokenColor)
                        .attr("data-component-type", "cross-token")
                        .attr("data-component-subtype", "filled")
                        .attr("data-component-id", crossTokenId);

                } else if (showAttn) {
                    // If the last row, we need to draw a cross token arrow that just goes from resid-in to the y level of attn-in
                    const attnCrossTokenX = centerX;
                    const attnCrossTokenStartY = centerY + residInRadius;
                    const attnCrossTokenEndY = centerY + residInRadius + 20;
                    const crossTokenColor = COLORS.red;

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
                        .attr("data-component-subtype", "line")
                        .attr("data-component-id", crossTokenId);
                }

                // Attn in arrow line variables
                const attnInXStart = centerX;
                const attnXEndOffset = 75;
                const attnInXEnd = centerX + attnXEndOffset;
                const componentY = centerY + residInRadius + 20;

                // Attn in arrow line. This connects from the cross token residual information into the attention component
                if (showAttn) {
                    g.append("line")
                        .attr("x1", attnInXStart)
                        .attr("y1", componentY)
                        .attr("x2", attnInXEnd)
                        .attr("y2", componentY)
                        .attr("stroke", attnColor)
                        .attr("stroke-width", 2)
                        .attr("data-component-type", "attn")
                        .attr("data-component-subtype", "line")
                        .attr("data-component-id", attnComponentId);

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
                        .attr("stroke-width", 2)
                        .attr("data-component-type", "attn")
                        .attr("data-component-subtype", "line")
                        .attr("data-component-id", attnComponentId);

                    // Attn out arrow head (pointing up, at the end of the line)
                    g.append("path")
                        .attr("d", `M ${attnOutX - arrowHeadSize / 2} ${attnOutYEnd + arrowHeadSize} L ${attnOutX} ${attnOutYEnd} L ${attnOutX + arrowHeadSize / 2} ${attnOutYEnd + arrowHeadSize} Z`)
                        .attr("fill", attnColor)
                        .attr("data-component-type", "attn")
                        .attr("data-component-subtype", "filled")
                        .attr("data-component-id", attnComponentId);

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
                        .attr("data-component-type", "attn")
                        .attr("data-component-subtype", "shape")
                        .attr("data-component-id", attnComponentId)
                        .attr("fill", COLORS.fills.red)
                        .style("cursor", showFlowOnHover ? "pointer" : "default");
                    
                    // Add hover and click handlers
                    if (showFlowOnHover) {
                        addComponentHandlers(attnRect, rowIndex, layerIndex, 'attn');
                    }
                }

                // MLP components
                if (showMlp) {
                    const mlpComponentId = `mlp-${rowIndex}-${layerIndex}`;
                    const mlpColor = COLORS.green;
                    
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
                        .attr("stroke-width", 2)
                        .attr("data-component-type", "mlp")
                        .attr("data-component-subtype", "line")
                        .attr("data-component-id", mlpComponentId);

                    // MLP out arrow line variables
                    const mlpOutX = attnInXEnd + 100;
                    const mlpOutYStart = componentY;
                    const mlpOutYEnd = residArrowY;

                    // MLP out arrow line
                    g.append("line")
                        .attr("x1", mlpOutX)
                        .attr("y1", mlpOutYStart)
                        .attr("x2", mlpOutX)
                        .attr("y2", mlpOutYEnd)
                        .attr("stroke", mlpColor)
                        .attr("stroke-width", 2)
                        .attr("data-component-type", "mlp")
                        .attr("data-component-subtype", "filled")
                        .attr("data-component-id", mlpComponentId);

                    // MLP out arrow connecting the MLP information back to the residual stream
                    g.append("path")
                        .attr("d", `M ${mlpOutX - arrowHeadSize / 2} ${mlpOutYEnd + arrowHeadSize} L ${mlpOutX} ${mlpOutYEnd} L ${mlpOutX + arrowHeadSize / 2} ${mlpOutYEnd + arrowHeadSize} Z`)
                        .attr("fill", mlpColor)
                        .attr("data-component-type", "mlp")
                        .attr("data-component-subtype", "filled")
                        .attr("data-component-id", mlpComponentId);

                    // Line visually bridging the MLP-in and MLP-out arrows
                    g.append("line")
                        .attr("x1", mlpInX)
                        .attr("y1", mlpInYEnd)
                        .attr("x2", mlpOutX)
                        .attr("y2", mlpOutYStart)
                        .attr("stroke", mlpColor)
                        .attr("stroke-width", 2)
                        .attr("data-component-type", "mlp")
                        .attr("data-component-subtype", "line")
                        .attr("data-component-id", mlpComponentId);

                    // MLP diamond
                    const mlpWidth = 20;
                    const mlpHeight = 20;
                    // Offset is distance between in and out lines, minus half the width of the square
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
                        .attr("data-component-type", "mlp")
                        .attr("data-component-subtype", "shape")
                        .attr("data-component-id", mlpComponentId)
                        .attr("fill", COLORS.fills.green)
                        .style("cursor", showFlowOnHover ? "pointer" : "default");
                    
                    // Add hover and click handlers
                    if (showFlowOnHover) {
                        addComponentHandlers(mlpRect, rowIndex, layerIndex, 'mlp');
                    }
                }
                
                // Add row hitbox for easier selection in row mode
                if (rowMode && showFlowOnHover) {
                    // Calculate hitbox dimensions
                    const hitboxX = dimensions.startX - dimensions.embedWidth - 20; // Start before embed
                    const hitboxWidth = dimensions.embedWidth + (numLayers * dimensions.layerWidth) + dimensions.unembedWidth + 40; // Full row width
                    const hitboxY = centerY - dimensions.rowHeight / 2;
                    const hitboxHeight = dimensions.rowHeight;
                    
                    // Create invisible rectangle for row selection
                    const rowHitbox = g.append("rect")
                        .attr("x", hitboxX)
                        .attr("y", hitboxY)
                        .attr("width", hitboxWidth)
                        .attr("height", hitboxHeight)
                        .attr("fill", "transparent")
                        .attr("stroke", "none")
                        .style("cursor", "pointer")
                    
                    // Add handlers - use 'resid' as component type since it triggers row highlighting in row mode
                    addComponentHandlers(rowHitbox, rowIndex, layerIndex, 'resid');
                }
            };

            // Draw all token rows for this layer
            for (let i = 0; i < numTokens; i++) {
                drawTokenRow(i);
            }
        };

        // Draw embed component (input side)
        const drawEmbed = () => {
            const trapezoidHeight = 20;
            const narrowWidth = 10;
            const wideWidth = 20;
            const embedX = dimensions.startX - dimensions.embedWidth + 20; // Position before first layer
            
            // Draw for each token
            for (let tokenIndex = 0; tokenIndex < numTokens; tokenIndex++) {
                const embedY = dimensions.startY + tokenIndex * dimensions.rowHeight;
                const embedComponentId = `embed-${tokenIndex}`;
                const embedColor = COLORS.blue;
                
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
                    .attr("data-component-subtype", "shape")
                    .attr("data-component-id", embedComponentId)
                    .attr("fill", COLORS.fills.blue)
                    .style("cursor", showFlowOnHover ? "pointer" : "default");
                
                // Set default fill - update effect will handle highlighting
                // embedShape.attr("fill", COLORS.fills.blue);
                
                // Add hover and click handlers
                if (showFlowOnHover) {
                    addComponentHandlers(embedShape, tokenIndex, 0, 'embed');
                }
                
                // Arrow from embed to first residual circle
                const arrowStartX = embedX + trapezoidHeight;
                const arrowEndX = dimensions.startX - 10; // Stop before the residual circle radius
                const arrowY = embedY;
                
                g.append("line")
                    .attr("x1", arrowStartX)
                    .attr("y1", arrowY)
                    .attr("x2", arrowEndX)
                    .attr("y2", arrowY)
                    .attr("stroke", embedColor)
                    .attr("stroke-width", 2)
                    .attr("data-component-type", "embed")
                    .attr("data-component-subtype", "line")
                    .attr("data-component-id", embedComponentId);
                
                // Arrow head
                const arrowHeadSize = 10;
                g.append("path")
                    .attr("d", `M ${arrowEndX - arrowHeadSize} ${arrowY - arrowHeadSize / 2} L ${arrowEndX} ${arrowY} L ${arrowEndX - arrowHeadSize} ${arrowY + arrowHeadSize / 2} Z`)
                    .attr("fill", embedColor)
                    .attr("data-component-type", "embed")
                    .attr("data-component-subtype", "filled")
                    .attr("data-component-id", embedComponentId);
            }
        };
        
        // Draw unembed component (output side)
        const drawUnembed = () => {
            const trapezoidHeight = 20;
            const narrowWidth = 10;
            const wideWidth = 20;
            // Position unembed at the end of the residual arrow (where it normally would end)
            const lastLayerCenterX = dimensions.startX + (numLayers - 1) * dimensions.layerWidth;
            const unembedX = lastLayerCenterX + 10 + 200; // residInRadius + residual arrow length
            
            // Draw for each token
            for (let tokenIndex = 0; tokenIndex < numTokens; tokenIndex++) {
                const unembedY = dimensions.startY + tokenIndex * dimensions.rowHeight;
                const unembedComponentId = `unembed-${tokenIndex}`;
                
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
                    .attr("stroke", COLORS.blue)
                    .attr("stroke-width", 2)
                    .attr("data-component-type", "unembed")
                    .attr("data-component-subtype", "shape")
                    .attr("data-component-id", unembedComponentId)
                    .attr("fill", COLORS.fills.blue)
                    .style("cursor", showFlowOnHover ? "pointer" : "default");
                
                // Add hover and click handlers
                if (showFlowOnHover) {
                    addComponentHandlers(unembedShape, tokenIndex, numLayers - 1, 'unembed');
                }
            }
        };
        
        // Draw token labels (y-axis)
        const drawLabels = () => {
            if (tokenLabels && tokenLabels.length > 0) {
                for (let i = 0; i < numTokens && i < tokenLabels.length; i++) {
                    const labelY = dimensions.startY + i * dimensions.rowHeight;
                    const labelX = dimensions.startX - dimensions.embedWidth - 10; // Position to the left of embed
                    
                    g.append("text")
                        .attr("x", labelX)
                        .attr("y", labelY)
                        .attr("text-anchor", "end")
                        .attr("dominant-baseline", "middle")
                        .attr("font-size", "14px")
                        .attr("fill", theme === "dark" ? "#D1D5DB" : "#374151")
                        .text(tokenLabels[i]);
                }
            }
            
            // Collect unembed dropdown positions instead of drawing labels
            if (unembedLabels && unembedLabels.length > 0) {
                const lastLayerCenterX = dimensions.startX + (numLayers - 1) * dimensions.layerWidth;
                const unembedX = lastLayerCenterX + 10 + 220;
                const positions: { x: number; y: number; tokenIndex: number }[] = [];
                
                for (let i = 0; i < numTokens && i < unembedLabels.length; i++) {
                    const labelY = dimensions.startY + i * dimensions.rowHeight;
                    const labelX = unembedX + 30; // Position to the right of unembed
                    
                    positions.push({
                        x: labelX, // Don't divide by scale here
                        y: labelY,
                        tokenIndex: i
                    });
                }
                
                setUnembedCardPositions(positions);
            } else {
                setUnembedCardPositions([]);
            }
        };
        
        // Draw all components
        drawEmbed();
        
        // Draw all layers
        for (let i = 0; i < numLayers; i++) {
            drawLayer(i);
        }
        
        drawUnembed();
        drawLabels();

    }, [dimensions, numTokens, numLayers, showAttn, showMlp, scale, tokenLabels, unembedLabels, showFlowOnHover, clickHandler]);

    // Separate effect to update highlighting without rebuilding the SVG
    useEffect(() => {
        if (!svgRef.current) return;
        
        const svg = d3.select(svgRef.current);
        const g = svg.select("g");
        if (g.empty()) return;
        
        // Update all component colors based on highlighting
        g.selectAll("[data-component-id]").each(function() {
            const element = d3.select(this);
            const componentId = element.attr("data-component-id");
            const componentType = element.attr("data-component-type");
            
            if (!componentId || !componentType) return;
            
            // Determine colors based on component type
            let defaultColor = COLORS.purple;
            let highlightedFillColor = COLORS.fills.purple;
            
            if (componentType === "attn" || componentType === "cross-token") {
                defaultColor = COLORS.red;
                highlightedFillColor = COLORS.fills.red;
            } else if (componentType === "mlp") {
                defaultColor = COLORS.green;
                highlightedFillColor = COLORS.fills.green;
            } else if (componentType === "embed" || componentType === "unembed") {
                defaultColor = COLORS.blue;
                highlightedFillColor = COLORS.fills.blue;
            }
            
            // Apply colors based on highlighting state
            // When highlightedComponents is null and showFlowOnHover is off, preserve current state
            // When highlightedComponents is null and showFlowOnHover is on, show all as highlighted
            const isHighlighted = highlightedComponents 
                ? highlightedComponents.has(componentId) 
                : (showFlowOnHover ? true : null); // null means preserve current state
            
            // If isHighlighted is null, don't update colors (preserve current state)
            if (isHighlighted === null) return;
            
            const pathColor = isHighlighted ? defaultColor : STROKE_BASE;
            const fillColor = isHighlighted ? highlightedFillColor : FILL_BASE;

            switch (element.attr("data-component-subtype")) {
                case "line":
                    element.attr("stroke", pathColor);
                    break;
                case "shape":
                    element.attr("fill", fillColor);
                    element.attr("stroke", pathColor);
                    break;
                case "filled":
                    element.attr("fill", pathColor);
                    element.attr("stroke", pathColor);
                    break;
            }
        });
        
    }, [highlightedComponents, theme, showFlowOnHover]);

    return (
        <div 
            ref={containerRef}
            className="rounded-lg overflow-auto relative"
            style={{ 
                maxWidth: '90vw', 
                maxHeight: '70vh',
                width: scale < 1 ? 'auto' : '90vw',
                height: scale < 1 ? 'auto' : '70vh'
            }}
        >
            <svg ref={svgRef}></svg>
            {/* Unembed dropdowns */}
            {unembedCardPositions.map((pos, idx) => (
                <div
                    key={`unembed-card-${pos.tokenIndex}`}
                    className="absolute pointer-events-auto"
                    style={{
                        left: `${pos.x * scale}px`,
                        top: `${pos.y * scale}px`,
                        transform: 'translate(0, -50%)'
                    }}
                >
                    <select className="text-xs rounded px-1 py-0.5 focus:outline-none">
                        <option value="logits">{unembedLabels && unembedLabels[idx]}</option>
                        <option value="probs">Probabilities</option>
                        <option value="topk">Top-K Tokens</option>
                    </select>
                </div>
            ))}
        </div>
    );
}