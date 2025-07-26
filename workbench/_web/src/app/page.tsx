"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function Page() {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current) return;

        // Clear any existing content
        d3.select(svgRef.current).selectAll("*").remove();

        const svg = d3.select(svgRef.current);
        const width = 1000;
        const height = 500;
        const centerX = width / 10;
        const centerY = height / 4;

        // Set SVG dimensions
        svg.attr("width", width).attr("height", height);

        // Create a group for the visualization
        const g = svg.append("g");

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

        // Residual arrow line
        g.append("line")
            .attr("x1", residArrowStartX)
            .attr("y1", residArrowY)
            .attr("x2", residArrowEndX)
            .attr("y2", residArrowY)
            .attr("stroke", "purple")
            .attr("stroke-width", 2);

        // Residual arrow head
        const arrowHeadSize = 10;
        g.append("path")
            .attr("d", `M ${residArrowEndX - arrowHeadSize} ${residArrowY - arrowHeadSize / 2} L ${residArrowEndX} ${residArrowY} L ${residArrowEndX - arrowHeadSize} ${residArrowY + arrowHeadSize / 2} Z`)
            .attr("fill", "purple");

        // A semi-circle path around the residual-in circle that connects previous residual-in information to later attention components
        const attnCrossTokenRadius = 25;
        const attnCrossTokenRoundedPath = `M ${centerX} ${centerY - attnCrossTokenRadius} A ${attnCrossTokenRadius} ${attnCrossTokenRadius} 0 0 1 ${centerX} ${centerY + attnCrossTokenRadius}`;

        g.append("path")
            .attr("d", attnCrossTokenRoundedPath)
            .attr("fill", "none")
            .attr("stroke", "red")
            .attr("stroke-width", 2);

        // Arrow that continues the connection from the cross token semi-circle to the next token
        const attnCrossTokenX = centerX;
        const attnCrossTokenStartY = centerY + residInRadius;
        const attnCrossTokenEndY = centerY + residInRadius + 60;

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

    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 border">
            <svg ref={svgRef}></svg>
        </div>
    );
}