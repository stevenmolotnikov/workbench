"use client";

import { TourProvider as ReactourTourProvider, PopoverContentProps } from "@reactour/tour";
import { ReactNode } from "react";

const FeatureTourSteps = [
    {
        selector: "#new-completion",
        content: "Welcome to the Logit Lens! This is your first step in the tour.",
    },
];

const LogitLensTourSteps = [
    {
        selector: "#new-completion",
        content: "Welcome to the Logit Lens! This is your first step in the tour.",
    },
    {
        selector: "#completion-text",
        content:
            "This is the second step of your tour. Here you can learn about different features.",
    },
    {
        selector: "#view-predictions",
        content: "This is the final step. You're now ready to explore the application!",
    },
    {
        selector: "#predictions-display",
        content: "This is the final step. You're now ready to explore the application!",
    },
];

export const TourSteps = {
    "feature": FeatureTourSteps,
    "logitLens": LogitLensTourSteps,
}

interface TourProviderProps {
    children: ReactNode;
}

function ContentComponent({currentStep, steps, setIsOpen, setCurrentStep, ...props}: PopoverContentProps) {
    const content = steps[currentStep].content;

    if (typeof content === "function") {
        return <div>
            Unsupported content type
        </div>
    }

    return (
        <div className="bg-card border w-full h-full p-4 rounded-lg">
            {content}
        </div>
    );
}

export function TourProvider({ children }: TourProviderProps) {
    return (
        <ReactourTourProvider
            steps={FeatureTourSteps}
            ContentComponent={ContentComponent}
            styles={{
                maskWrapper: (base) => ({ ...base, color: "transparent", cursor: "not-allowed" }),
                popover: (base) => ({ ...base, padding: 0, backgroundColor: "transparent" })
            }}
        >
            {children}
        </ReactourTourProvider>
    );
}
