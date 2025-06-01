"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAnnotations, type Annotation } from "@/stores/useAnnotations";
import { useState } from "react";

const AnnotationTitle = {
    "lineGraph": "Line Graph",
    "lineGraphRange": "Line Graph Range",
    "heatmap": "Heatmap",
    "token": "Token",
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
                            <Button variant="outline" size="sm" onClick={cancelPendingAnnotation}>
                                Cancel
                            </Button>
                            <Button size="sm" onClick={handleSetPendingAnnotation} disabled={!text.trim()}>
                                Add Annotation
                            </Button>
                        </div>
                    </div>
                )}

                {/* Annotations list */}
                {annotations.length === 0 && !pendingAnnotation ? (
                    <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground">
                            No annotations yet
                        </p>
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
                                        className="group bg-card border border-border rounded-lg p-4 hover:border-border/80 hover:shadow-sm transition-all duration-200 cursor-pointer"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                {/* Header with type */}
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
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
                                            
                                            {/* Delete button */}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteAnnotation(annotation.data.id);
                                                }}
                                            >
                                                ×
                                            </Button>
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
