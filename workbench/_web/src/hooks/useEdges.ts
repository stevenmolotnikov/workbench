import { useRef, useEffect, useCallback } from "react";

import { useConnections } from "@/stores/useConnections";

// Utility functions
const isHighlighted = (tokenElement: HTMLElement) =>
    tokenElement.classList.contains('bg-primary/30');


const useEdges = () => {
    const {
        isDragging,
        currentConnection,
        setIsDragging,
        setCurrentConnection,
        selectedEdgeIndex,
        removeConnectionByIndex,
        setSelectedEdgeIndex,
    } = useConnections();

    const svgRef = useRef<SVGSVGElement>(null);

    // Change cursor while dragging
    useEffect(() => {
        document.body.style.cursor = isDragging ? "pointer" : "default";
        return () => {
            document.body.style.cursor = "default";
        };
    }, [isDragging]);

    // Handle keyboard events for connection deletion
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Backspace" && selectedEdgeIndex !== null) {
                removeConnectionByIndex(selectedEdgeIndex);
                setSelectedEdgeIndex(null);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedEdgeIndex, removeConnectionByIndex]);

    // Handle window mouse up for connection cancellation
    useEffect(() => {
        const handleWindowMouseUp = (e: MouseEvent) => {
            if (!isDragging) return;

            const target = e.target as HTMLElement;
            const tokenElement = target.closest("[data-token-id]") as HTMLElement;

            if (!tokenElement || !isHighlighted(tokenElement)) {
                setIsDragging(false);
                setCurrentConnection({});
            }
        };

        window.addEventListener("mouseup", handleWindowMouseUp);
        return () => window.removeEventListener("mouseup", handleWindowMouseUp);
    }, [isDragging]);

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!isDragging || !svgRef.current) return;

            const svgRect = svgRef.current.getBoundingClientRect();
            setCurrentConnection({
                ...currentConnection,
                end: {
                    x: e.clientX - svgRect.left,
                    y: e.clientY - svgRect.top,
                    tokenIndices: [],
                    counterIndex: -1,
                },
            });
        },
        [isDragging, currentConnection, setCurrentConnection]
    );

    // Handle mouse movement during dragging
    useEffect(() => {
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [handleMouseMove]);

    return {
        svgRef,
    };
};

export default useEdges;
