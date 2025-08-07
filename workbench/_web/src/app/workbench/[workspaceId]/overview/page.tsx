"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { getAllAnnotationsForWorkspace } from "@/lib/queries/annotationQueries";
import { getOrCreateLensCharts } from "@/lib/queries/chartQueries";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layers, Grid3X3, X, Search } from "lucide-react";
import { Heatmap } from "@/components/charts/heatmap/Heatmap";
import { Line } from "@/components/charts/line/Line";
import { HeatmapData, LineGraphData } from "@/types/charts";
import { LineAnnotation, HeatmapAnnotation } from "@/types/annotations";
import type { Annotation, Chart } from "@/db/schema";

type AnnotationWithChart = Annotation & { chart: Chart };

function AnnotationCard({ 
    annotation, 
    isSelected, 
    onClick 
}: { 
    annotation: AnnotationWithChart;
    isSelected: boolean;
    onClick: () => void;
}) {
    const getIcon = () => {
        switch (annotation.type) {
            case "line":
                return <Layers className="h-4 w-4" />;
            case "heatmap":
                return <Grid3X3 className="h-4 w-4" />;
            default:
                return null;
        }
    };

    const getDetails = () => {
        if (annotation.type === "line") {
            const data = annotation.data as LineAnnotation;
            return data.layerEnd !== undefined 
                ? `Layers ${data.layerStart}-${data.layerEnd}`
                : `Layer ${data.layerStart}`;
        } else if (annotation.type === "heatmap") {
            const data = annotation.data as HeatmapAnnotation;
            return `Cells: ${data.cellIds.length}`;
        }
        return "";
    };

    return (
        <Card 
            className={`p-3 cursor-pointer transition-all ${
                isSelected 
                    ? "ring-2 ring-primary bg-primary/5" 
                    : "hover:bg-muted/50"
            }`}
            onClick={onClick}
        >
            <div className="flex items-start gap-2">
                <div className="mt-1">{getIcon()}</div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium capitalize">
                            {annotation.type}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {getDetails()}
                        </span>
                    </div>
                    <p className="text-sm text-foreground/90 break-words">
                        {(annotation.data as any).text}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Chart: {annotation.chart.id.slice(0, 8)}...
                    </p>
                </div>
            </div>
        </Card>
    );
}

function FilteredChartViewer({ 
    selectedAnnotations,
    workspaceId 
}: { 
    selectedAnnotations: Set<string>;
    workspaceId: string;
}) {
    const [activeTab, setActiveTab] = useState<string | null>(null);

    const { data: annotationsData = [] } = useQuery({
        queryKey: ["workspace-annotations", workspaceId],
        queryFn: () => getAllAnnotationsForWorkspace(workspaceId),
    });

    const { data: { lensCharts = [], unlinkedCharts = [] } = {} } = useQuery({
        queryKey: ["lensCharts", workspaceId],
        queryFn: () => getOrCreateLensCharts(workspaceId, {
            workspaceId: workspaceId,
        }),
    });

    const allCharts = useMemo(() => {
        return [...lensCharts, ...unlinkedCharts];
    }, [lensCharts, unlinkedCharts]);

    const filteredCharts = useMemo(() => {
        if (selectedAnnotations.size === 0) {
            const chartsWithAnnotations = new Set(annotationsData.map(a => a.chartId));
            return allCharts.filter(c => chartsWithAnnotations.has(c.id));
        }
        
        const selectedChartIds = new Set(
            annotationsData
                .filter(a => selectedAnnotations.has(a.id))
                .map(a => a.chartId)
        );
        
        return allCharts.filter(c => selectedChartIds.has(c.id));
    }, [allCharts, selectedAnnotations, annotationsData]);

    const activeChart = useMemo(() => {
        return filteredCharts.find(c => c.id === activeTab) || filteredCharts[0];
    }, [filteredCharts, activeTab]);

    if (filteredCharts.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                    <p className="text-sm">No charts to display</p>
                    <p className="text-xs mt-1">Select annotations to view related charts</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <Tabs 
                value={activeChart?.id || ""} 
                onValueChange={setActiveTab} 
                className="flex-1 flex flex-col"
            >
                <div className="px-2 pt-1 flex items-center gap-1 bg-background">
                    <TabsList className="h-8 bg-transparent">
                        {filteredCharts.map((chart) => (
                            <div key={chart.id} className="inline-flex items-center group relative">
                                <TabsTrigger
                                    value={chart.id}
                                    className="data-[state=active]:bg-muted rounded-b-none h-8 pr-2 relative !shadow-none"
                                >
                                    <span className="px-2">
                                        {chart.type === "heatmap" ? "Heatmap" : chart.type === "line" ? "Line" : "Untitled"} Chart
                                    </span>
                                </TabsTrigger>
                            </div>
                        ))}
                    </TabsList>
                </div>

                <div className="flex flex-col h-full p-4">
                    <div className="flex h-full w-full border rounded">
                        {activeChart?.data && activeChart.type === "heatmap" ? (
                            <Heatmap data={activeChart.data as HeatmapData} />
                        ) : activeChart?.data && activeChart.type === "line" ? (
                            <Line data={activeChart.data as LineGraphData} />
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                No chart data available
                            </div>
                        )}
                    </div>
                </div>
            </Tabs>
        </div>
    );
}

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