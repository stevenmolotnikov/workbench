"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAnnotations } from "@/stores/useAnnotations";
import { useCharts } from "@/stores/useCharts";
import { useLensWorkspace } from "@/stores/useLensWorkspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
    ArrowLeft,
    Search,
    Filter,
    CircleDotDashed,
    Spline,
    Grid3X3,
    ALargeSmall,
    FolderOpen,
    AlertCircle,
    BarChart3
} from "lucide-react";
import type { Annotation, AnnotationGroup } from "@/stores/useAnnotations";

type FilterBy = "all" | "orphaned" | "grouped" | "ungrouped" | "lineGraph" | "heatmap" | "token";

export default function ExportPage() {
    const router = useRouter();
    const { annotations, groups } = useAnnotations();
    const { gridPositions } = useCharts();
    const { completions } = useLensWorkspace();
    
    const [searchQuery, setSearchQuery] = useState("");
    const [filterBy, setFilterBy] = useState<FilterBy>("all");
    const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);

    // Get all annotations including those in groups
    const allAnnotations = useMemo(() => {
        const ungroupedAnnotations = annotations.map(annotation => ({...annotation, groupId: undefined}));
        const groupedAnnotations = groups.flatMap((group: AnnotationGroup) => 
            group.annotations.map((annotation: Annotation) => ({
                ...annotation,
                groupId: group.id
            }))
        );
        return [...ungroupedAnnotations, ...groupedAnnotations];
    }, [annotations, groups]);

    // Filter annotations
    const filteredAnnotations = useMemo(() => {
        let filtered = allAnnotations;
        
        // Apply text search
        if (searchQuery) {
            filtered = filtered.filter((annotation) =>
                annotation.data.text.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        
        // Apply filter
        switch (filterBy) {
            case "orphaned":
                filtered = filtered.filter((a) => a.data.isOrphaned);
                break;
            case "grouped":
                filtered = filtered.filter((a) => a.groupId);
                break;
            case "ungrouped":
                filtered = filtered.filter((a) => !a.groupId);
                break;
            case "lineGraph":
                filtered = filtered.filter((a) => a.type === "lineGraph" || a.type === "lineGraphRange");
                break;
            case "heatmap":
                filtered = filtered.filter((a) => a.type === "heatmap");
                break;
            case "token":
                filtered = filtered.filter((a) => a.type === "token");
                break;
        }
        
        // Sort by most recent first
        filtered.sort((a, b) => {
            return b.data.id.localeCompare(a.data.id);
        });
        
        return filtered;
    }, [allAnnotations, searchQuery, filterBy]);

    const getAnnotationIcon = (type: Annotation["type"]) => {
        switch (type) {
            case "lineGraph":
                return CircleDotDashed;
            case "lineGraphRange":
                return Spline;
            case "heatmap":
                return Grid3X3;
            case "token":
                return ALargeSmall;
        }
    };
    
    const getAnnotationDetails = (annotation: Annotation) => {
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
                return `${positions.length} cells`;
            case "token":
                return "Token annotation";
        }
    };
    
    const getGroupName = (groupId?: string) => {
        if (!groupId) return null;
        const group = groups.find((g: AnnotationGroup) => g.id === groupId);
        return group?.name || "Unknown Group";
    };

    const getRelatedChart = (annotation: Annotation & { groupId?: string }) => {
        const chartIndex = 'chartIndex' in annotation.data ? (annotation.data as any).chartIndex : undefined;
        if (chartIndex !== undefined && gridPositions[chartIndex]) {
            return gridPositions[chartIndex];
        }
        return null;
    };

    const handleBackToWorkbench = () => {
        router.back();
    };

    return (
        <div className="flex flex-col h-[94vh]">
            {/* Header */}
            <div className="border-b p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={handleBackToWorkbench}>
                            <ArrowLeft size={16} />
                            Back
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">Clean View</h1>
                            <p className="text-muted-foreground">
                                Review your annotations and charts without distractions
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{allAnnotations.length} annotations</span>
                        <span>{groups.length} collections</span>
                        <span>{gridPositions.length} charts</span>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="border-b p-4">
                <div className="flex gap-4">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search annotations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    
                    {/* Filter */}
                    <Select value={filterBy} onValueChange={(value) => setFilterBy(value as FilterBy)}>
                        <SelectTrigger className="w-[180px]">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Filter by..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Annotations</SelectItem>
                            <SelectItem value="orphaned">Orphaned Only</SelectItem>
                            <SelectItem value="grouped">Grouped Only</SelectItem>
                            <SelectItem value="ungrouped">Ungrouped Only</SelectItem>
                            <SelectItem value="lineGraph">Line Graphs</SelectItem>
                            <SelectItem value="heatmap">Heatmaps</SelectItem>
                            <SelectItem value="token">Tokens</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Annotations List */}
                <div className="w-1/2 border-r overflow-auto">
                    <div className="p-4">
                        <h2 className="text-lg font-semibold mb-4">Annotations ({filteredAnnotations.length})</h2>
                        
                        {filteredAnnotations.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                {searchQuery || filterBy !== "all" 
                                    ? "No annotations match your criteria" 
                                    : "No annotations yet"}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredAnnotations.map((annotation) => {
                                    const Icon = getAnnotationIcon(annotation.type);
                                    const groupName = getGroupName(annotation.data.groupId);
                                    const isSelected = selectedAnnotation?.data.id === annotation.data.id;
                                    
                                    return (
                                        <Card 
                                            key={annotation.data.id}
                                            className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                                                isSelected ? "ring-2 ring-primary" : ""
                                            } ${annotation.data.isOrphaned ? "border-orange-500/30" : ""}`}
                                            onClick={() => setSelectedAnnotation(annotation)}
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex items-start gap-3">
                                                    <Icon className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="font-medium text-sm">
                                                                {getAnnotationDetails(annotation)}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                Chart #{('chartIndex' in annotation.data ? (annotation.data as any).chartIndex : 0) || 0}
                                                            </span>
                                                            {annotation.data.isOrphaned && (
                                                                <span className="flex items-center gap-1 text-xs text-orange-600">
                                                                    <AlertCircle className="h-3 w-3" />
                                                                    Orphaned
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-foreground mb-2 line-clamp-3">
                                                            {annotation.data.text}
                                                        </p>
                                                        {groupName && (
                                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                <FolderOpen className="h-3 w-3" />
                                                                {groupName}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Chart Display */}
                <div className="w-1/2 overflow-auto">
                    <div className="p-4">
                        <h2 className="text-lg font-semibold mb-4">Chart Details</h2>
                        
                        {!selectedAnnotation ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Select an annotation to view its associated chart</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Selected Annotation</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            <div>
                                                <span className="text-sm font-medium">Type: </span>
                                                <span className="text-sm">{getAnnotationDetails(selectedAnnotation)}</span>
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium">Text: </span>
                                                <p className="text-sm mt-1">{selectedAnnotation.data.text}</p>
                                            </div>
                                            {getGroupName(selectedAnnotation.data.groupId) && (
                                                <div>
                                                    <span className="text-sm font-medium">Collection: </span>
                                                    <span className="text-sm">{getGroupName(selectedAnnotation.data.groupId)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {(() => {
                                    const relatedChart = getRelatedChart(selectedAnnotation);
                                    return (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-base">Associated Chart</CardTitle>
                                                                                                                <CardDescription>
                                                                    Chart #{('chartIndex' in selectedAnnotation.data ? (selectedAnnotation.data as any).chartIndex : 0) || 0}
                                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                {relatedChart ? (
                                                    <div className="space-y-2">
                                                        <div>
                                                            <span className="text-sm font-medium">Type: </span>
                                                            <span className="text-sm capitalize">{relatedChart.chartData?.type || 'Not configured'}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-sm font-medium">Completions: </span>
                                                            <span className="text-sm">{relatedChart.completion_ids.length}</span>
                                                        </div>
                                                        {relatedChart.completion_ids.length > 0 && (
                                                            <div className="mt-3">
                                                                <p className="text-sm font-medium mb-2">Completion IDs:</p>
                                                                <div className="text-xs text-muted-foreground space-y-1">
                                                                    {relatedChart.completion_ids.map((id, index) => (
                                                                        <div key={id} className="font-mono">
                                                                            {index + 1}. {id}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-muted-foreground">
                                                        {selectedAnnotation.data.isOrphaned 
                                                            ? "Chart has been deleted" 
                                                            : "No chart data available"}
                                                    </p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}