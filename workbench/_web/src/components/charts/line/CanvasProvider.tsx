import React, { createContext, useContext, useRef, useEffect, ReactNode } from "react";
import { Point } from "@nivo/core";

interface CanvasContextValue {
    // Range State
    handlePointClick: (point: Point) => void;
}

const CanvasContext = createContext<CanvasContextValue | null>(null);

export const useCanvas = () => {
    const context = useContext(CanvasContext);
    if (!context) {
        throw new Error("useCanvas must be used within a CanvasProvider");
    }
    return context;
};

interface CanvasProviderProps {
    children: ReactNode;
}

export const CanvasProvider: React.FC<CanvasProviderProps> = ({ children }) => {

    const containerRef = useRef<HTMLDivElement | null>(null)
    const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null)
    const margin = { top: 50, right: 30, bottom: 70, left: 75 }

    // Ensure the overlay canvas matches container size and device pixel ratio
    useEffect(() => {
        const canvas = overlayCanvasRef.current
        if (!canvas) return

        const updateCanvasSize = () => {
            const rect = canvas.getBoundingClientRect()
            const dpr = window.devicePixelRatio || 1
            canvas.width = Math.max(1, Math.floor(rect.width * dpr))
            canvas.height = Math.max(1, Math.floor(rect.height * dpr))
            const ctx = canvas.getContext('2d')
            if (ctx) {
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
                ctx.clearRect(0, 0, rect.width, rect.height)
            }
        }

        updateCanvasSize()
        window.addEventListener('resize', updateCanvasSize)
        return () => window.removeEventListener('resize', updateCanvasSize)
    }, [])

    const drawSelectionCircle = (x: number, y: number) => {
        const canvas = overlayCanvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        const rect = canvas.getBoundingClientRect()

        // Clear previous selection and draw new one
        ctx.clearRect(0, 0, rect.width, rect.height)
        ctx.beginPath()
        ctx.arc(x, y, 8, 0, Math.PI * 2)
        ctx.strokeStyle = '#3b82f6'
        ctx.lineWidth = 2
        ctx.stroke()
    }

    const handlePointClick = (point: Point) => {
        // Nivo's canvas line returns x/y relative to inner chart area (excluding margins)
        if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') return
        const x = point.x + margin.left
        const y = point.y + margin.top
        drawSelectionCircle(x, y)
    }

    const contextValue: CanvasContextValue = {
        handlePointClick,
    };

    return (
        <div ref={containerRef} className="size-full relative">
            <canvas
                ref={overlayCanvasRef}
                className="absolute inset-0 size-full pointer-events-none z-10"
            />
            <CanvasContext.Provider value={contextValue}>

                {children}
            </CanvasContext.Provider>
        </div>
    );
};
