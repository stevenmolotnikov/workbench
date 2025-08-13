"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAnnotations } from "@/stores/useAnnotations";
import { getAnnotations } from "@/lib/queries/annotationQueries";
import { useCreateAnnotation, useDeleteAnnotation } from "@/lib/api/annotationsApi";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { X, CircleDot, Layers, Grid3X3 } from "lucide-react";
import type { LineAnnotation, HeatmapAnnotation, AnnotationData } from "@/types/annotations";
import { NewAnnotation } from "@/db/schema";
import { useParams } from "next/navigation";

export function AnnotationsDisplay() {
    const { pendingAnnotation, setPendingAnnotation } = useAnnotations();
    const { chartId } = useParams<{ chartId: string }>();  
    const [annotationText, setAnnotationText] = useState("");

    const { mutate: createAnnotation, isPending: isCreating } = useCreateAnnotation();
    const { mutate: deleteAnnotation } = useDeleteAnnotation();

    const { data: annotations = [] } = useQuery({
        queryKey: ["annotations", chartId],
        queryFn: () => getAnnotations(chartId as string),
        enabled: !!chartId,
    });

    useEffect(() => {
        setPendingAnnotation(null);
        setAnnotationText("");
    }, [chartId, setPendingAnnotation]);

    const handleSaveAnnotation = () => {
        if (!pendingAnnotation || !annotationText.trim() || !chartId) return;

        const newAnnotation: NewAnnotation = {
            chartId: chartId,
            type: pendingAnnotation.type,
            data: {
                ...pendingAnnotation,
                text: annotationText.trim(),
            },
        };

        createAnnotation(newAnnotation, {
            onSuccess: () => {
                setPendingAnnotation(null);
                setAnnotationText("");
            },
        }
        );
    };

    const handleCancelAnnotation = () => {
        setPendingAnnotation(null);
        setAnnotationText("");
    };

    const handleDeleteAnnotation = (id: string) => {
        deleteAnnotation({ id, chartId: chartId });
    };

    const formatAnnotationDetails = (type: string, data: AnnotationData) => {
        console.log(data)
        console.log("ANNOTATIONS", annotations)
        if (type === "line") {
            const lineData = data as LineAnnotation;
            if (lineData.layerEnd !== undefined) {
                return `Layers ${lineData.layerStart}-${lineData.layerEnd}`;
            }
            return `Layer ${lineData.layerStart}`;
        } else if (type === "heatmap") {
            const heatmapData = data as HeatmapAnnotation;
            return `Cells: ${heatmapData.cellIds.length}`;
        }
        return "";
    };

    const getAnnotationIcon = (type: string) => {
        switch (type) {
            case "line":
                return <Layers className="h-4 w-4" />;
            case "heatmap":
                return <Grid3X3 className="h-4 w-4" />;
            default:
                return <CircleDot className="h-4 w-4" />;
        }
    };

    return (
        <>
            <div className="h-12 px-3 py-2 border-b items-center flex">
                Annotations
            </div>

            <div className="flex flex-col h-full p-2">


                {pendingAnnotation && (
                    <Card className="p-4 mb-2 rounded">
                        <div className="space-y-3">
                            <div>
                                <div className="flex items-center gap-2 text-sm font-medium mb-1">
                                    {getAnnotationIcon(pendingAnnotation.type)}
                                    <span className="capitalize">{pendingAnnotation.type} Annotation</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {formatAnnotationDetails(pendingAnnotation.type, pendingAnnotation)}
                                </p>
                            </div>

                            <Textarea
                                placeholder="Enter your annotation..."
                                value={annotationText}
                                onChange={(e) => setAnnotationText(e.target.value)}
                                className="min-h-[80px]"
                            />

                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    onClick={handleSaveAnnotation}
                                    disabled={!annotationText.trim() || isCreating}
                                    className="flex-1"
                                >
                                    Save
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCancelAnnotation}
                                    disabled={isCreating}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}

                <ScrollArea className="flex-1">
                    <div className="space-y-2">
                        {annotations.length === 0 && !pendingAnnotation && (
                            <div className="text-center py-8 text-muted-foreground">
                                <p className="text-sm">No annotations yet</p>
                                <p className="text-xs mt-1">Click on the chart to add annotations</p>
                            </div>
                        )}

                        {annotations.map((annotation) => (
                            <Card key={annotation.id} className="p-3 rounded">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            {getAnnotationIcon(annotation.type)}
                                            <span className="text-sm font-medium capitalize">
                                                {annotation.type}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {formatAnnotationDetails(annotation.type, annotation.data)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-foreground/90 break-words">
                                            {annotation.data.text}
                                        </p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0 flex-shrink-0"
                                        onClick={() => handleDeleteAnnotation(annotation.id)}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </>
    );
}