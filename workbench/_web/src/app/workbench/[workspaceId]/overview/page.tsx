"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { getAllAnnotationsForWorkspace } from "@/lib/queries/annotationQueries";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { AnnotationCard } from "./components/AnnotationCard";
import { FilteredChartViewer } from "./components/FilteredChartViewer";

export default function OverviewPage() {
    const { workspaceId } = useParams();
    const [selectedAnnotations, setSelectedAnnotations] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");

    const { data: annotations = [], isLoading } = useQuery({
        queryKey: ["workspace-annotations", workspaceId],
        queryFn: () => getAllAnnotationsForWorkspace(workspaceId as string),
        enabled: !!workspaceId,
    });

    const filteredAnnotations = useMemo(() => {
        if (!searchQuery.trim()) return annotations;
        const query = searchQuery.toLowerCase();
        return annotations.filter(a => 
            (a.data as any).text?.toLowerCase().includes(query)
        );
    }, [annotations, searchQuery]);

    const toggleAnnotation = (id: string) => {
        setSelectedAnnotations(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const clearSelection = () => {
        setSelectedAnnotations(new Set());
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[94vh]">
                <div className="text-muted-foreground">Loading annotations...</div>
            </div>
        );
    }

    return (
        <div className="flex h-[94vh]">
            <div className="w-[50%] border-r p-4 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                    <h1 className="text-xl font-semibold">Annotations</h1>
                    {selectedAnnotations.size > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={clearSelection}
                            className="flex items-center gap-1"
                        >
                            <X className="h-3 w-3" />
                            Clear ({selectedAnnotations.size})
                        </Button>
                    )}
                </div>
                
                <Input
                    placeholder="Search annotations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="mb-4"
                />
                
                <ScrollArea className="flex-1">
                    {annotations.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <p className="text-sm">No annotations in this workspace</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {filteredAnnotations.map((annotation) => (
                                <AnnotationCard
                                    key={annotation.id}
                                    annotation={annotation}
                                    isSelected={selectedAnnotations.has(annotation.id)}
                                    onClick={() => toggleAnnotation(annotation.id)}
                                />
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>

            <div className="w-[50%] bg-muted/30">
                <FilteredChartViewer 
                    selectedAnnotations={selectedAnnotations}
                    workspaceId={workspaceId as string}
                />
            </div>
        </div>
    );
}