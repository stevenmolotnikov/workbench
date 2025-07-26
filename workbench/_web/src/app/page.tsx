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

        // Inner circle (outline only)
        const innerRadius = 15;
        g.append("circle")
            .attr("cx", centerX)
            .attr("cy", centerY)
            .attr("r", innerRadius)
            .attr("fill", "none")
            .attr("stroke", "purple")
            .attr("stroke-width", 2);

        // Arrow coming out of the right side of the circle
        const residArrowStartX = centerX + innerRadius;
        const residArrowEndX = centerX + innerRadius + 240;
        const residArrowY = centerY;

        // Arrow line
        g.append("line")
            .attr("x1", residArrowStartX)
            .attr("y1", residArrowY)
            .attr("x2", residArrowEndX)
            .attr("y2", residArrowY)
            .attr("stroke", "purple")
            .attr("stroke-width", 2);

        // Arrow head
        const arrowHeadSize = 10;
        g.append("path")
            .attr("d", `M ${residArrowEndX - arrowHeadSize} ${residArrowY - arrowHeadSize / 2} L ${residArrowEndX} ${residArrowY} L ${residArrowEndX - arrowHeadSize} ${residArrowY + arrowHeadSize / 2} Z`)
            .attr("fill", "purple");

        // Semicircle path around the inner circle (right side)
        const semicircleRadius = 25;
        const semicirclePath = `M ${centerX} ${centerY - semicircleRadius} A ${semicircleRadius} ${semicircleRadius} 0 0 1 ${centerX} ${centerY + semicircleRadius}`;

        g.append("path")
            .attr("d", semicirclePath)
            .attr("fill", "none")
            .attr("stroke", "red")
            .attr("stroke-width", 2);

        // Arrow coming out of the bottom side of the circle
        const bottomArrowX = centerX;
        const bottomArrowStartY = centerY + semicircleRadius;
        const bottomArrowEndY = centerY + semicircleRadius + 60;

        // Bottom arrow line
        g.append("line")
            .attr("x1", bottomArrowX)
            .attr("y1", bottomArrowStartY)
            .attr("x2", bottomArrowX)
            .attr("y2", bottomArrowEndY)
            .attr("stroke", "red")
            .attr("stroke-width", 2);

        // Arrow head (pointing down, at the end of the line)
        g.append("path")
            .attr("d", `M ${bottomArrowX - arrowHeadSize / 2} ${bottomArrowEndY - arrowHeadSize} L ${bottomArrowX} ${bottomArrowEndY} L ${bottomArrowX + arrowHeadSize / 2} ${bottomArrowEndY - arrowHeadSize} Z`)
            .attr("fill", "red");

        // Line forking out of the bottom arrow
        const attnInXStart = centerX;
        const attnInXEnd = centerX + 80;
        const componentY = centerY + innerRadius + 25;

        // Arrow line
        g.append("line")
            .attr("x1", attnInXStart)
            .attr("y1", componentY)
            .attr("x2", attnInXEnd)
            .attr("y2", componentY)
            .attr("stroke", "red")
            .attr("stroke-width", 2);

        // Arrow going back into the purple line from the red fork
        const attnOutX = attnInXEnd;
        const attnOutYStart = componentY;
        const attnOutYEnd = residArrowY;

        // Arrow line
        g.append("line")
            .attr("x1", attnOutX)
            .attr("y1", attnOutYStart)
            .attr("x2", attnOutX)
            .attr("y2", attnOutYEnd)
            .attr("stroke", "red")
            .attr("stroke-width", 2);

        // Arrow head (pointing up, at the end of the line)
        g.append("path")
            .attr("d", `M ${attnOutX - arrowHeadSize / 2} ${attnOutYEnd + arrowHeadSize} L ${attnOutX} ${attnOutYEnd} L ${attnOutX + arrowHeadSize / 2} ${attnOutYEnd + arrowHeadSize} Z`)
            .attr("fill", "red");


        // Red square
        const redSquareWidth = 20;
        const redSquareHeight = 20;
        const redSquareX = centerX + 40;
        const redSquareY = centerY + innerRadius + (25 - redSquareHeight / 2);

        g.append("rect")
            .attr("x", redSquareX)
            .attr("y", redSquareY)
            .attr("width", redSquareWidth)
            .attr("height", redSquareHeight)
            .attr("stroke", "red")
            .attr("stroke-width", 2)
            // Fill white so the line beneath is not visible
            .attr("fill", "white");

        // Arrow going back into the purple line from the red fork
        const mlpInX = attnInXEnd + 50;
        const mlpInYStart = residArrowY;
        const mlpInYEnd = componentY;

        // Arrow line
        g.append("line")
            .attr("x1", mlpInX)
            .attr("y1", mlpInYStart)
            .attr("x2", mlpInX)
            .attr("y2", mlpInYEnd)
            .attr("stroke", "green")
            .attr("stroke-width", 2);

        // Arrow going back into the purple line from the red fork
        const mlpOutX = attnInXEnd + 150;
        const mlpOutYStart = componentY;
        const mlpOutYEnd = residArrowY;

        // Arrow line
        g.append("line")
            .attr("x1", mlpOutX)
            .attr("y1", mlpOutYStart)
            .attr("x2", mlpOutX)
            .attr("y2", mlpOutYEnd)
            .attr("stroke", "green")
            .attr("stroke-width", 2);


        // Arrow head (pointing up)
        g.append("path")
            .attr("d", `M ${mlpOutX - arrowHeadSize / 2} ${mlpOutYEnd + arrowHeadSize} L ${mlpOutX} ${mlpOutYEnd} L ${mlpOutX + arrowHeadSize / 2} ${mlpOutYEnd + arrowHeadSize} Z`)
            .attr("fill", "green");

        // Line going from MLP to MLP
        g.append("line")
            .attr("x1", mlpInX)
            .attr("y1", mlpInYEnd)
            .attr("x2", mlpOutX)
            .attr("y2", mlpOutYStart)
            .attr("stroke", "green")
            .attr("stroke-width", 2);

        // Green rotated square
        const greenSquareWidth = 20;
        const greenSquareHeight = 20;
        // Offset is distance between in and out lines, minus half the width of the square
        const greenSquareOffset = ((mlpOutX - mlpInX) / 2) - (greenSquareWidth / 2);
        const greenSquareX = mlpInX + greenSquareOffset;
        const greenSquareY = centerY + innerRadius + (25 - greenSquareHeight / 2);

        g.append("rect")
            .attr("x", greenSquareX)
            .attr("y", greenSquareY)
            .attr("width", greenSquareWidth)
            .attr("height", greenSquareHeight)
            .attr("stroke", "green")
            .attr("stroke-width", 2)
            // Fill white so the line beneath is not visible
            .attr("fill", "white")
            .attr("transform", `rotate(45, ${greenSquareX + greenSquareWidth / 2}, ${greenSquareY + greenSquareHeight / 2})`);

    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 border">
            <svg ref={svgRef}></svg>
        </div>
    );
}