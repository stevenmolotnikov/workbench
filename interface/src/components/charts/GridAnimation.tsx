"use client"

import { useEffect, useRef } from "react"
import anime from "animejs" // Standard import for anime.js
import { useGridAnimation } from "./GridAnimationContext"

// Define a type for the element and index parameters
type AnimeCallback = (el: HTMLElement, i: number) => string;

export default function GridAnimation({

}) {
    // Configuration
    const gridSize = 6 // 6x6 grid
    const lineSize = 6 // 6 circles in vertical line
    const normalSpacing = 30
    const compactSpacing = 25 // Spacing when squares come together
    const centerX = 250 // Center X of container
    const centerY = 250 // Center Y of container

    // Use the shared context instead of local state
    const { currentLayout, isAnimating, setIsAnimating } = useGridAnimation()

    const containerRef = useRef<HTMLDivElement>(null)
    const timelineRef = useRef<anime.AnimeTimelineInstance | null>(null)
    const shapesRef = useRef<HTMLDivElement[]>([])

    // Calculate positions based on spacing
    const calculatePositions = (spacing: number) => {
        return {
            startX: centerX - (gridSize * spacing) / 2 + spacing / 2,
            startY: centerY - (gridSize * spacing) / 2 + spacing / 2,
            lineStartY: centerY - (lineSize * spacing) / 2 + spacing / 2,
        }
    }

    // Create shapes array for rendering
    const shapes = Array.from({ length: gridSize * gridSize }, (_, i) => {
        const positions = calculatePositions(normalSpacing)
        const initialLeft = `${centerX - 20}px` // Center horizontally
        const initialTop = `${positions.lineStartY + (i % lineSize) * normalSpacing}px`
        const initialOpacity = i >= lineSize ? 0 : 1

        return (
            <div
                key={i}
                ref={(el) => {
                    if (el) shapesRef.current[i] = el
                }}
                className="shape"
                style={{
                    position: "absolute",
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    backgroundColor: "#262626",
                    border: "2px solid #404040",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    left: initialLeft,
                    top: initialTop,
                    opacity: initialOpacity,
                }}
            />
        )
    })

    // Create animation timeline based on current layout
    const createCircleSquareTimeline = () => {
        // Clear previous timeline if it exists
        if (timelineRef.current) timelineRef.current.pause()

        timelineRef.current = anime.timeline({
            easing: "easeInOutQuad",
            loop: false,
            autoplay: false,
        })

        if (currentLayout === "line") {
            // Animation for line layout
            const lineTargets = shapesRef.current.slice(0, lineSize)

            // First animation: circles to squares
            timelineRef.current.add({
                targets: lineTargets,
                borderRadius: ["50%", "10%"],
                backgroundColor: ["#262626", "#3b82f6"],
                borderWidth: ["1px", "0px"],
                scale: [1, 0.9],
                delay: anime.stagger(100),
                duration: 800,
                begin: () => {
                    // After a small delay, bring shapes closer
                    setTimeout(() => updatePositions(true), 400)
                },
            })

            // Second animation: squares to circles
            timelineRef.current.add({
                targets: lineTargets,
                borderRadius: ["10%", "50%"],
                backgroundColor: ["#3b82f6", "#262626"],
                borderWidth: ["0px", "1px"],
                scale: [0.9, 1],
                delay: anime.stagger(100),
                duration: 800,
                begin: () => {
                    // After a small delay, move shapes back to normal spacing
                    setTimeout(() => updatePositions(false), 400)
                },
                complete: () => {
                    // Signal that animation is complete
                    setIsAnimating(false)
                },
            })
        } else {
            // Animation for grid layout
            // First animation: circles to squares
            timelineRef.current.add({
                targets: shapesRef.current,
                borderRadius: ["50%", "10%"],
                backgroundColor: ["#262626", "#3b82f6"],
                borderWidth: ["1px", "0px"],
                scale: [1, 0.9],
                delay: anime.stagger(50, {
                    grid: [gridSize, gridSize],
                    from: "center",
                }),
                duration: 800,
                begin: () => {
                    // After a small delay, bring shapes closer
                    setTimeout(() => updatePositions(true), 400)
                },
            })

            // Second animation: squares to circles
            timelineRef.current.add({
                targets: shapesRef.current,
                borderRadius: ["10%", "50%"],
                backgroundColor: ["#3b82f6", "#262626"],
                borderWidth: ["0px", "1px"],
                scale: [0.9, 1],
                delay: anime.stagger(50, {
                    grid: [gridSize, gridSize],
                    from: "center",
                }),
                duration: 800,
                begin: () => {
                    // After a small delay, move shapes back to normal spacing
                    setTimeout(() => updatePositions(false), 400)
                },
                complete: () => {
                    // Signal that animation is complete
                    setIsAnimating(false)
                },
            })
        }
    }

    // Update positions based on layout and shape type
    const updatePositions = (isSquare: boolean) => {
        // Calculate positions based on spacing
        const spacing = isSquare ? compactSpacing : normalSpacing
        const positions = calculatePositions(spacing)

        if (currentLayout === "line") {
            // Update line layout positions
            anime({
                targets: shapesRef.current.slice(0, lineSize),
                top: ((_el: HTMLElement, i: number) => `${positions.lineStartY + (i % lineSize) * spacing}px`) as AnimeCallback,
                duration: 500,
                easing: "easeInOutQuad",
            })
        } else {
            // Update grid layout positions
            anime({
                targets: shapesRef.current,
                left: ((_el: HTMLElement, i: number) => `${positions.startX + (i % gridSize) * spacing}px`) as AnimeCallback,
                top: ((_el: HTMLElement, i: number) => `${positions.startY + Math.floor(i / gridSize) * spacing}px`) as AnimeCallback,
                duration: 500,
                easing: "easeInOutQuad",
            })
        }
    }

    // Set layout to line
    const setLineLayout = () => {
        // Calculate positions
        const positions = calculatePositions(normalSpacing)

        // First ensure all circles
        resetShapes()

        // Animate to line layout
        anime({
            targets: shapesRef.current,
            opacity: ((_el: HTMLElement, i: number) => (i < lineSize ? 1 : 0)) as AnimeCallback,
            left: `${centerX - 20}px`, // Center horizontally
            top: ((_el: HTMLElement, i: number) => `${positions.lineStartY + (i % lineSize) * normalSpacing}px`) as AnimeCallback,
            duration: 800,
            easing: "easeInOutQuad",
            complete: () => {
                createCircleSquareTimeline()
            },
        })
    }

    // Set layout to grid
    const setGridLayout = () => {
        // Calculate positions
        const positions = calculatePositions(normalSpacing)

        // First ensure all circles
        resetShapes()

        // Animate to grid layout
        anime({
            targets: shapesRef.current,
            opacity: 1,
            left: ((_el: HTMLElement, i: number) => `${positions.startX + (i % gridSize) * normalSpacing}px`) as AnimeCallback,
            top: ((_el: HTMLElement, i: number) => `${positions.startY + Math.floor(i / gridSize) * normalSpacing}px`) as AnimeCallback,
            duration: 800,
            easing: "easeInOutQuad",
            complete: () => {
                createCircleSquareTimeline()
            },
        })
    }

    // Reset shapes to initial state
    const resetShapes = () => {
        anime({
            targets: shapesRef.current,
            borderRadius: "50%",
            backgroundColor: "#262626",
            borderWidth: "1px",
            scale: 1,
            duration: 300,
            easing: "easeInOutQuad",
        })
    }

    // Play animation
    const playAnimation = () => {
        if (timelineRef.current) {
            timelineRef.current.play()
        }
    }

    // Initialize timeline on mount and when layout changes
    useEffect(() => {
        createCircleSquareTimeline()
    }, [currentLayout])

    // Handle layout changes
    useEffect(() => {
        if (currentLayout === "line") {
            setLineLayout()
        } else {
            setGridLayout()
        }
    }, [currentLayout])

    // Handle animation trigger from context
    useEffect(() => {
        if (isAnimating) {
            playAnimation()
        }
    }, [isAnimating])

    return (
        <div ref={containerRef} className="relative h-full w-full">
            {shapes}
        </div>
    )
}
