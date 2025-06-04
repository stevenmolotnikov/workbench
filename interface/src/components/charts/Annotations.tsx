"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAnnotations, type Annotation } from "@/stores/useAnnotations";
import { CircleDotDashed, Spline, Grid3X3, ALargeSmall, X } from "lucide-react";
import { useState } from "react";

const AnnotationTitle = {
    lineGraph: "Point",
    lineGraphRange: "Range",
    heatmap: "Cells",
    token: "Token",
};

function formatAnnotationDetails(annotation: Annotation) {
    switch (annotation.type) {
        case "lineGraph":
            return `Layer ${annotation.data.layer}`;
        case "lineGraphRange":
            return `Layers ${annotation.data.start}-${annotation.data.end}`;
        case "heatmap":
            const positions = annotation.data.positions;
            if (positions.length === 1) {
                return `Cell (${positions[0].row}, ${positions[0].col})`;
            }
            return `${positions.length} cells selected`;
        case "token":
            return "Token annotation";
        default:
            return "";
    }
}

const AnnotationIcons = {
    lineGraph: CircleDotDashed,
    lineGraphRange: Spline,
    heatmap: Grid3X3,
    token: ALargeSmall,
};

export function Annotations() {
    const {
        annotations,
        pendingAnnotation,
        setPendingAnnotation,
        cancelPendingAnnotation,
        deleteAnnotation,
        setEmphasizedAnnotation,
        clearEmphasizedAnnotation,
    } = useAnnotations();

    const [text, setText] = useState("");

    const handleSetPendingAnnotation = () => {
        setPendingAnnotation(text);
        setText("");
    };

    const handleEmphasizedAnnotation = (annotation: Annotation) => {
        setEmphasizedAnnotation(annotation);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-auto p-4 space-y-4">
                {/* Annotation input form */}
                {pendingAnnotation && (
                    <div className="bg-card border border-border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <div>
                                <p className="text-sm font-semibold text-foreground">
                                    Add {AnnotationTitle[pendingAnnotation.type]} Annotation
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {formatAnnotationDetails(pendingAnnotation)}
                                </p>
                            </div>
                        </div>
                        <Textarea
                            className="w-full mb-3 border-border focus:border-border"
                            placeholder="Enter your annotation here..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            rows={3}
                        />
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                className="w-full"
                                size="sm"
                                onClick={cancelPendingAnnotation}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                className="w-full"
                                onClick={handleSetPendingAnnotation}
                                disabled={!text.trim()}
                            >
                                Add
                            </Button>
                        </div>
                    </div>
                )}

                {/* Annotations list */}
                {annotations.length === 0 && !pendingAnnotation ? (
                    <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground">No annotations yet</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Click on a chart to add annotations
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {annotations.map(
                            (annotation) =>
                                annotation.data.text !== "" && (
                                    <div
                                        key={annotation.data.id}
                                        onMouseEnter={() => handleEmphasizedAnnotation(annotation)}
                                        onMouseLeave={() => clearEmphasizedAnnotation()}
                                        className="group bg-card border rounded-lg p-4 transition-all duration-200 cursor-pointer relative"
                                    >
                                        {/* Delete button - positioned absolutely in top right */}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="absolute top-4 right-4 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteAnnotation(annotation.data.id);
                                            }}
                                        >
                                            <X />
                                        </Button>

                                        <div className="flex items-start">
                                            <div className="flex-1 min-w-0 pr-8">
                                                {/* Header with type */}
                                                <div className="flex items-center gap-2 mb-2">
                                                    {(() => {
                                                        const IconComponent =
                                                            AnnotationIcons[annotation.type];
                                                        return (
                                                            <IconComponent className="h-4 w-4 text-muted-foreground" />
                                                        );
                                                    })()}
                                                    <span className="inline-flex items-center py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                                                        {AnnotationTitle[annotation.type]}
                                                    </span>
                                                </div>

                                                {/* Details */}
                                                <p className="text-xs text-muted-foreground mb-2">
                                                    {formatAnnotationDetails(annotation)}
                                                </p>

                                                {/* Annotation text */}
                                                <p className="text-sm text-foreground leading-relaxed">
                                                    {annotation.data.text}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
