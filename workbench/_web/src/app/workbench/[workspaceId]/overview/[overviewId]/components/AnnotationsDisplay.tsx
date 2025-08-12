"use client";

import { useQuery } from "@tanstack/react-query";
import { getAllAnnotationsForWorkspace } from "@/lib/queries/annotationQueries";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { CircleDot, Layers, Grid3X3 } from "lucide-react";
import type { LineAnnotation, HeatmapAnnotation, AnnotationData } from "@/types/annotations";
import { useParams } from "next/navigation";

export function AnnotationsDisplay() {
    const { workspaceId } = useParams<{ workspaceId: string }>();  

    const { data: annotations = [] } = useQuery({
        queryKey: ["annotations", workspaceId],
        queryFn: () => getAllAnnotationsForWorkspace(workspaceId as string),
        enabled: !!workspaceId,
    });

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
                <ScrollArea className="flex-1">
                    <div className="space-y-2">
                        {annotations.length === 0 && (
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
                                </div>
                            </Card>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </>
    );
}