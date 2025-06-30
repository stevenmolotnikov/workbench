"use client";

import { useState, useMemo } from "react";
import { useAnnotations } from "@/stores/useAnnotations";
import { useCharts } from "@/stores/useCharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
    Grid3X3, 
    List, 
    Search, 
    Filter,
    ChevronDown,
    AlertCircle,
    CircleDotDashed,
    Spline,
    ALargeSmall,
    Calendar,
    Tag,
    FolderOpen
} from "lucide-react";
import type { Annotation, AnnotationGroup } from "@/stores/useAnnotations";
import { formatDistanceToNow } from "date-fns";

type ViewMode = "grid" | "list";
type SortBy = "date" | "type" | "group" | "chartIndex";
type FilterBy = "all" | "orphaned" | "grouped" | "ungrouped" | "lineGraph" | "heatmap" | "token";

export default function SummariesPage() {
    const { annotations, groups } = useAnnotations();
    const { gridPositions } = useCharts();
    
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<SortBy>("date");
    const [filterBy, setFilterBy] = useState<FilterBy>("all");
    
    // Get all annotations including those in groups
    const allAnnotations = useMemo(() => {
        const ungroupedAnnotations = annotations;
        const groupedAnnotations = groups.flatMap((group: AnnotationGroup) => 
            group.annotations.map((annotation: Annotation) => ({
                ...annotation,
                data: { ...annotation.data, groupId: group.id }
            }))
        );
        return [...ungroupedAnnotations, ...groupedAnnotations];
    }, [annotations, groups]);
    
    // Filter annotations
    const filteredAnnotations = useMemo(() => {
        let filtered = allAnnotations;
        
        // Apply text search
        if (searchQuery) {
            filtered = filtered.filter((annotation: Annotation) =>
                annotation.data.text.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        
        // Apply filter
        switch (filterBy) {
            case "orphaned":
                filtered = filtered.filter((a: Annotation) => a.data.isOrphaned);
                break;
            case "grouped":
                filtered = filtered.filter((a: Annotation) => a.data.groupId);
                break;
            case "ungrouped":
                filtered = filtered.filter((a: Annotation) => !a.data.groupId);
                break;
            case "lineGraph":
                filtered = filtered.filter((a: Annotation) => a.type === "lineGraph" || a.type === "lineGraphRange");
                break;
            case "heatmap":
                filtered = filtered.filter((a: Annotation) => a.type === "heatmap");
                break;
            case "token":
                filtered = filtered.filter((a: Annotation) => a.type === "token");
                break;
        }
        
        // Apply sorting
        filtered.sort((a: Annotation, b: Annotation) => {
            switch (sortBy) {
                case "date":
                    // Newest first (assuming ID contains timestamp)
                    return b.data.id.localeCompare(a.data.id);
                case "type":
                    return a.type.localeCompare(b.type);
                case "group":
                    return (a.data.groupId || "").localeCompare(b.data.groupId || "");
                case "chartIndex":
                    const aIndex = "chartIndex" in a.data ? a.data.chartIndex : -1;
                    const bIndex = "chartIndex" in b.data ? b.data.chartIndex : -1;
                    return aIndex - bIndex;
                default:
                    return 0;
            }
        });
        
        return filtered;
    }, [allAnnotations, searchQuery, filterBy, sortBy]);
    
    const getAnnotationIcon = (type: Annotation["type"]) => {
        switch (type) {
            case "lineGraph":
            case "lineGraphRange":
                return type === "lineGraph" ? CircleDotDashed : Spline;
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
    
    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Summaries</h1>
                <p className="text-muted-foreground mt-2">
                    View and manage all your annotations and collections in one place
                </p>
            </div>
            
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
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
                
                {/* Sort */}
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
                    <SelectTrigger className="w-[180px]">
                        <ChevronDown className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="type">Type</SelectItem>
                        <SelectItem value="group">Group</SelectItem>
                        <SelectItem value="chartIndex">Chart Index</SelectItem>
                    </SelectContent>
                </Select>
                
                {/* View mode */}
                <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
                    <TabsList>
                        <TabsTrigger value="grid">
                            <Grid3X3 className="h-4 w-4" />
                        </TabsTrigger>
                        <TabsTrigger value="list">
                            <List className="h-4 w-4" />
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>
            
            {/* Summary stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Total Annotations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{allAnnotations.length}</div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Orphaned</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                            {allAnnotations.filter((a) => a.data.isOrphaned).length}
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Groups</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{groups.length}</div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Active Charts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{gridPositions.length}</div>
                    </CardContent>
                </Card>
            </div>
            
            {/* Content */}
            {filteredAnnotations.length === 0 ? (
                <Card className="text-center py-12">
                    <CardContent>
                        <p className="text-muted-foreground">
                            {searchQuery || filterBy !== "all" 
                                ? "No annotations match your search criteria." 
                                : "No annotations yet. Create some in the workbench!"}
                        </p>
                    </CardContent>
                </Card>
            ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredAnnotations.map((annotation) => {
                        const Icon = getAnnotationIcon(annotation.type);
                        const groupName = getGroupName(annotation.data.groupId);
                        
                        return (
                            <Card 
                                key={annotation.data.id}
                                className={`hover:shadow-lg transition-shadow ${
                                    annotation.data.isOrphaned ? "border-orange-500/30" : ""
                                }`}
                            >
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <Icon className="h-5 w-5 text-muted-foreground" />
                                        {annotation.data.isOrphaned && (
                                            <AlertCircle className="h-4 w-4 text-orange-600" />
                                        )}
                                    </div>
                                    <CardTitle className="text-sm mt-2">
                                        {getAnnotationDetails(annotation)}
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Chart #{annotation.data.chartIndex || 0}
                                        {annotation.data.isOrphaned && " (deleted)"}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm line-clamp-3 mb-3">{annotation.data.text}</p>
                                    {groupName && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <FolderOpen className="h-3 w-3" />
                                            {groupName}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {filteredAnnotations.map((annotation) => {
                                const Icon = getAnnotationIcon(annotation.type);
                                const groupName = getGroupName(annotation.data.groupId);
                                
                                return (
                                    <div 
                                        key={annotation.data.id}
                                        className={`p-4 hover:bg-muted/50 ${
                                            annotation.data.isOrphaned ? "opacity-75" : ""
                                        }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium text-sm">
                                                        {getAnnotationDetails(annotation)}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        Chart #{annotation.data.chartIndex || 0}
                                                    </span>
                                                    {annotation.data.isOrphaned && (
                                                        <span className="flex items-center gap-1 text-xs text-orange-600">
                                                            <AlertCircle className="h-3 w-3" />
                                                            Orphaned
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground mb-2">
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
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}