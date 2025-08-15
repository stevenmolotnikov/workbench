import { useCallback, useEffect, useMemo, useState } from "react";
import { Delaunay } from "d3-delaunay";
import { lineMargin as margin } from "../theming";
import { useLineData } from "./LineDataProvider";

interface Tooltip {
    visible: boolean;
    left: number;
    top: number;
    xVal: number | string;
    yVal: number | null;
}

interface VoronoiPoint {
    px: number;
    py: number;
    x: number;
    y: number;
}

interface VoronoiData {
    points: VoronoiPoint[];
    delaunay: Delaunay<number>;
}

interface UseMeshProps {
    selectionCanvasRef: React.RefObject<HTMLCanvasElement>;
}

const useMesh = ({ selectionCanvasRef }: UseMeshProps) => {
    const { data, bounds } = useLineData();
    
    // Track canvas dimensions to trigger Voronoi recalculation
    const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
    
    useEffect(() => {
        const updateDimensions = () => {
            const canvas = selectionCanvasRef.current;
            if (canvas) {
                const rect = canvas.getBoundingClientRect();
                setCanvasDimensions({ width: rect.width, height: rect.height });
            }
        };
        
        updateDimensions();
        
        const observer = new ResizeObserver(updateDimensions);
        if (selectionCanvasRef.current) {
            observer.observe(selectionCanvasRef.current);
        }
        
        return () => observer.disconnect();
    }, [selectionCanvasRef]);
    
    // Scales derived from container size and current ranges
    const getScales = useCallback(() => {
        const canvas = selectionCanvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const innerWidth = Math.max(1, rect.width - margin.left - margin.right);
        const innerHeight = Math.max(1, rect.height - margin.top - margin.bottom);
        const xDomain = [bounds.xMin, bounds.xMax];
        const yDomain = [bounds.yMin, bounds.yMax];
        const xScale = (x: number) => margin.left + ((x - xDomain[0]) / (xDomain[1] - xDomain[0])) * innerWidth;
        const yScale = (y: number) => margin.top + (1 - (y - yDomain[0]) / (yDomain[1] - yDomain[0])) * innerHeight;
        const xInvert = (px: number) => xDomain[0] + ((px - margin.left) / innerWidth) * (xDomain[1] - xDomain[0]);
        const yInvert = (py: number) => yDomain[0] + (1 - (py - margin.top) / innerHeight) * (yDomain[1] - yDomain[0]);
        return { xScale, yScale, xInvert, yInvert };
    }, [bounds.xMin, bounds.xMax, bounds.yMin, bounds.yMax, selectionCanvasRef]);
    
    const [tooltip, setTooltip] = useState<Tooltip>({ 
        visible: false, 
        left: 0, 
        top: 0, 
        xVal: "", 
        yVal: null 
    });

    // Build Voronoi mesh from current data and scales
    const voronoiData = useMemo((): VoronoiData | null => {
        const scales = getScales();
        if (!scales) return null;
        
        const points: VoronoiPoint[] = [];
        data.lines.forEach(line => {
            line.data.forEach(pt => {
                const px = scales.xScale(pt.x as number);
                const py = scales.yScale(pt.y as number);
                if (Number.isFinite(px) && Number.isFinite(py)) {
                    points.push({ px, py, x: pt.x as number, y: pt.y as number });
                }
            });
        });
        
        if (points.length === 0) return null;
        const delaunay = Delaunay.from(points.map(p => [p.px, p.py] as [number, number]));
        return { points, delaunay };
    
        // Extra dependency so the mesh renders on load
    }, [data, getScales, canvasDimensions]);

    const handleMove = useCallback((e: MouseEvent) => {
        if (!voronoiData) {
            return setTooltip(prev => prev.visible ? { ...prev, visible: false } : prev);
        }
        
        const canvas = selectionCanvasRef.current;
        const rect = canvas?.getBoundingClientRect();
        if (!rect || !canvas) {
            return setTooltip(prev => prev.visible ? { ...prev, visible: false } : prev);
        }
        
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Check if mouse is within the chart area (inside margins)
        if (x < margin.left || x > canvas.clientWidth - margin.right ||
            y < margin.top || y > canvas.clientHeight - margin.bottom) {
            return setTooltip(prev => prev.visible ? { ...prev, visible: false } : prev);
        }
        
        const idx = voronoiData.delaunay.find(x, y);
        const p = voronoiData.points[idx];
        
        if (!p) {
            return setTooltip(prev => prev.visible ? { ...prev, visible: false } : prev);
        }
        
        setTooltip({ 
            visible: true, 
            left: e.clientX + 12, 
            top: e.clientY - 12, 
            xVal: p.x, 
            yVal: p.y 
        });
    }, [voronoiData, selectionCanvasRef]);

    const handleLeave = useCallback(() => {
        setTooltip(prev => prev.visible ? { ...prev, visible: false } : prev);
    }, []);

    useEffect(() => {
        const el = selectionCanvasRef.current;
        if (!el) return;
        
        el.addEventListener("mousemove", handleMove);
        el.addEventListener("mouseleave", handleLeave);
        
        return () => {
            el.removeEventListener("mousemove", handleMove);
            el.removeEventListener("mouseleave", handleLeave);
        };
    }, [handleMove, handleLeave, selectionCanvasRef]);

    return {
        tooltip,
        voronoiData
    };
};

export default useMesh;