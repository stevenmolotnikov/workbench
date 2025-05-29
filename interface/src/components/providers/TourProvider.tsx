"use client";

import { TourProvider as ReactourTourProvider, PopoverContentProps } from "@reactour/tour";
import React, { ReactNode } from "react";

const FeatureTourSteps = [
    {
        selector: "#new-completion",
        content: "Welcome to the Logit Lens! This is your first step in the tour.",
    },
];

const LogitLensTourSteps = [
    {
        selector: "#new-completion",
        content:
            "For most experiments, the best prompts will be incomplete statements with a correct, expected single-token solution. Start by entering a prompt like `The Eiffel Tower is in the city of`",
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
    feature: FeatureTourSteps,
    logitLens: LogitLensTourSteps,
};

interface TourProviderProps {
    children: ReactNode;
}

function ContentComponent({
    currentStep,
    steps,
    setIsOpen,
    setCurrentStep,
    ...props
}: PopoverContentProps) {
    const content = steps[currentStep].content;

    if (typeof content === "function") {
        return <div>Unsupported content type</div>;
    }

    return (
        <div className="bg-card border w-full h-full p-4 rounded-lg">
            {renderTextWithBackticks(content as string)}
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
                popover: (base) => ({ ...base, padding: 0, backgroundColor: "transparent" }),
            }}
        >
            {children}
        </ReactourTourProvider>
    );
}

interface ParsedSegment {
    type: "text" | "code";
    content: string;
}

export function parseBackticks(text: string): ParsedSegment[] {
    const segments: ParsedSegment[] = [];
    let currentIndex = 0;

    while (currentIndex < text.length) {
        const nextBacktick = text.indexOf("`", currentIndex);

        if (nextBacktick === -1) {
            // No more backticks, add remaining text
            if (currentIndex < text.length) {
                segments.push({
                    type: "text",
                    content: text.slice(currentIndex),
                });
            }
            break;
        }

        // Add text before backtick
        if (nextBacktick > currentIndex) {
            segments.push({
                type: "text",
                content: text.slice(currentIndex, nextBacktick),
            });
        }

        // Find closing backtick
        const closingBacktick = text.indexOf("`", nextBacktick + 1);

        if (closingBacktick === -1) {
            // No closing backtick, treat as regular text
            segments.push({
                type: "text",
                content: text.slice(nextBacktick),
            });
            break;
        }

        // Add code segment
        segments.push({
            type: "code",
            content: text.slice(nextBacktick + 1, closingBacktick),
        });

        currentIndex = closingBacktick + 1;
    }

    return segments;
}

export function renderTextWithBackticks(text: string): React.ReactElement {
    const segments = parseBackticks(text);

    return (
        <span>
            {segments.map((segment, index) => {
                if (segment.type === "code") {
                    return (
                        <code
                            key={index}
                            className="bg-muted text-foreground px-1.5 py-0.5 rounded text-sm font-mono border"
                        >
                            {segment.content}
                        </code>
                    );
                }
                // Split text by newlines and render each part with line breaks
                return segment.content.split('\n').map((line, lineIndex) => (
                    <React.Fragment key={`${index}-${lineIndex}`}>
                        {lineIndex > 0 && <br />}
                        {line}
                    </React.Fragment>
                ));
            })}
        </span>
    );
}
