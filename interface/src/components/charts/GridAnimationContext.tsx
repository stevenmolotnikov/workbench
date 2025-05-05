"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface GridAnimationContextType {
  currentLayout: "line" | "grid"
  setCurrentLayout: (layout: "line" | "grid") => void
  triggerAnimation: () => void
  isAnimating: boolean
  setIsAnimating: (isAnimating: boolean) => void
}

const GridAnimationContext = createContext<GridAnimationContextType | undefined>(undefined)

export function GridAnimationProvider({ children }: { children: ReactNode }) {
  const [currentLayout, setCurrentLayout] = useState<"line" | "grid">("line")
  const [isAnimating, setIsAnimating] = useState(false)

  const triggerAnimation = () => {
    if (!isAnimating) {
      setIsAnimating(true)
      // Animation will set isAnimating back to false when complete
    }
  }

  return (
    <GridAnimationContext.Provider 
      value={{ 
        currentLayout, 
        setCurrentLayout, 
        triggerAnimation, 
        isAnimating,
        setIsAnimating
      }}
    >
      {children}
    </GridAnimationContext.Provider>
  )
}

export function useGridAnimation() {
  const context = useContext(GridAnimationContext)
  if (context === undefined) {
    throw new Error("useGridAnimation must be used within a GridAnimationProvider")
  }
  return context
} 