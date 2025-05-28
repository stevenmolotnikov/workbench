"use client";

import { TourProvider as ReactourTourProvider } from "@reactour/tour";
import { ReactNode } from "react";

const steps = [
    {
        selector: "#new-completion",
        content: "Welcome to the Logit Lens! This is your first step in the tour.",
    },
    {
        selector: "#completion-text", 
        content: "This is the second step of your tour. Here you can learn about different features.",
    },
    {
        selector: "#view-predictions",
        content: "This is the final step. You're now ready to explore the application!",
    },
    {
      selector: "#predictions-display",
      content: "This is the final step. You're now ready to explore the application!",
      position: "bottom"
  },
];

interface TourProviderProps {
    children: ReactNode;
}

export function TourProvider({ children }: TourProviderProps) {
    const radius = 10
    return (
          <ReactourTourProvider 
            steps={steps} 
            styles={{
              popover: (base) => ({
                ...base,
                '--reactour-accent': '#ef5a3d',
                borderRadius: radius,
              }),
              maskArea: (base) => ({ ...base, rx: radius }),
              maskWrapper: (base) => ({ ...base, display: 'none' }),
            //   badge: (base) => ({ ...base, left: 'auto', right: '-0.8125em' }),
              arrow: (base) => ({ ...base, display: 'none' }),
              dot: (base) => ({ ...base, display: 'none' }),
              controls: (base) => ({ ...base, marginTop: 100 }),
            //   close: (base) => ({ ...base, right: 'auto', left: 8, top: 8 }),
            }}
          >
            {children}
        </ReactourTourProvider>
    );
} 