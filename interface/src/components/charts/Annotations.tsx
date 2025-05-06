"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Annotation } from "@/types/workspace";


interface AnnotationsProps {
    annotations: Annotation[];
    activeAnnotation: { x: number; y: number } | null;
    annotationText: string;
    setAnnotationText: (text: string) => void;
    addAnnotation: () => void;
    cancelAnnotation: () => void;
    deleteAnnotation: (id: string) => void;
}

export function Annotations({
    annotations,
    activeAnnotation,
    annotationText,
    setAnnotationText,
    addAnnotation,
    cancelAnnotation,
    deleteAnnotation
}: AnnotationsProps) {
    return (
        <div className="flex flex-col">
            <div className="p-4 border-b">
                <h2 className="text-sm font-medium">Annotations</h2>
            </div>
            <div className="flex-1 overflow-auto p-4">
                {/* Annotation input form */}
                {activeAnnotation && (
                    <div className="mb-6 p-4 border rounded-md">
                        <p className="text-sm font-medium mb-2">Add Annotation at Layer {activeAnnotation.x}</p>
                        <Textarea
                            className="w-full mb-3"
                            placeholder="Enter your annotation here..."
                            value={annotationText}
                            onChange={(e) => setAnnotationText(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={cancelAnnotation}>
                                Cancel
                            </Button>
                            <Button size="sm" onClick={addAnnotation}>
                                Add
                            </Button>
                        </div>
                    </div>
                )}

                {/* Annotations list */}
                {annotations.length === 0 && !activeAnnotation ? (
                    <p className="text-sm text-muted-foreground">No annotations yet. Click on a chart to add annotations.</p>
                ) : (
                    <div className="flex flex-col gap-3">
                        {annotations.map((annotation) => annotation.text !== "" && (
                            <div key={annotation.id} className="flex items-start justify-between rounded-md border p-3 text-sm">
                                <div>
                                    <p className="font-medium mb-1">Layer: {annotation.x}</p>
                                    <p>{annotation.text}</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => deleteAnnotation(annotation.id)}
                                >
                                    &times;
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}