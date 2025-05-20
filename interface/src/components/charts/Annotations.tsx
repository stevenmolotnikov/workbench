"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLineGraphAnnotations } from "@/stores/lineGraphAnnotations";
import { useState } from "react";
import { LineGraphAnnotation } from "@/types/workspace";

export function Annotations() {
    const {
        annotations,
        pendingAnnotation,
        setPendingAnnotation,
        cancelPendingAnnotation,
        deleteAnnotation,
        setEmphasizedAnnotation,
        clearEmphasizedAnnotation,
    } = useLineGraphAnnotations();

    const [text, setText] = useState("");

    const handleSetPendingAnnotation = () => {
        setPendingAnnotation(text);
        setText("");
    };

    const handleEmphasizedAnnotation = (annotation: LineGraphAnnotation) => {
        setEmphasizedAnnotation(annotation);
    };

    return (
        <div className="flex flex-col">
            {/* <div className="p-4 border-b">
                <h2 className="text-sm font-medium">Annotations</h2>
            </div> */}
            <div className="flex-1 overflow-auto p-4">
                {/* Annotation input form */}
                {pendingAnnotation && (
                    <div className="mb-6 p-4 border rounded-md">
                        <p className="text-sm font-medium mb-2">Add Annotation</p>
                        <Textarea
                            className="w-full mb-3"
                            placeholder="Enter your annotation here..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={cancelPendingAnnotation}>
                                Cancel
                            </Button>
                            <Button size="sm" onClick={handleSetPendingAnnotation}>
                                Add
                            </Button>
                        </div>
                    </div>
                )}

                {/* Annotations list */}
                {annotations.length === 0 && !pendingAnnotation ? (
                    <p className="text-sm text-muted-foreground">
                        No annotations yet. Click on a chart to add annotations.
                    </p>
                ) : (
                    <div className="flex flex-col gap-3">
                        {annotations.map(
                            (annotation) =>
                                annotation.text !== "" && (
                                    <div
                                        key={annotation.id}
                                        onMouseEnter={() => handleEmphasizedAnnotation(annotation)}
                                        onMouseLeave={() => clearEmphasizedAnnotation()}
                                        className="flex items-start justify-between rounded-md border p-3 text-sm"
                                    >
                                        <p>{annotation.text}</p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0"
                                            onClick={() => deleteAnnotation(annotation.id)}
                                        >
                                            &times;
                                        </Button>
                                    </div>
                                )
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
