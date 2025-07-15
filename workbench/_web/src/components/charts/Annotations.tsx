"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useAnnotations, type Annotation, type AnnotationGroup } from "@/stores/useAnnotations";
import { 
    CircleDotDashed, 
    Spline, 
    Grid3X3, 
    ALargeSmall, 
    X, 
    ChevronDown, 
    ChevronRight,
    FolderOpen,
    GripVertical,
    Edit2,
    Check,
    AlertCircle,
    RotateCcw
} from "lucide-react";
import { useState } from "react";
import {
    DndContext,
    type DragEndEvent,
    DragOverlay,
    type DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
    closestCenter,
    DragOverEvent,
    rectIntersection,
} from "@dnd-kit/core";
import {
    useDraggable,
    useDroppable,
} from "@dnd-kit/core";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
// import { useCharts } from "@/stores/useCharts";
import { useLensWorkspace } from "@/stores/useLensWorkspace";

const AnnotationTitle = {
    lineGraph: "Point",
    lineGraphRange: "Range",
    heatmap: "Cells",
    token: "Token",
};

function formatAnnotationDetails(annotation: Annotation) {
    const orphanedInfo = annotation.data.isOrphaned 
        ? ` • Chart #${annotation.data.originalChartIndex} (deleted)` 
        : '';
    
    switch (annotation.type) {
        case "lineGraph":
            return `Layer ${annotation.data.layer}${orphanedInfo}`;
        case "lineGraphRange":
            return `Layers ${annotation.data.start}-${annotation.data.end}${orphanedInfo}`;
        case "heatmap":
            const positions = annotation.data.positions;
            if (positions.length === 1) {
                return `Cell (${positions[0].row}, ${positions[0].col})${orphanedInfo}`;
            }
            return `${positions.length} cells selected${orphanedInfo}`;
        case "token":
            return `Token annotation${orphanedInfo}`;
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

interface DraggableAnnotationProps {
    annotation: Annotation;
    isInGroup?: string;
    onDelete: (id: string) => void;
    onEmphasize: (annotation: Annotation) => void;
    onClearEmphasize: () => void;
}

function DraggableAnnotation({ 
    annotation, 
    isInGroup, 
    onDelete, 
    onEmphasize, 
    onClearEmphasize 
}: DraggableAnnotationProps) {
    const {
        attributes,
        listeners,
        setNodeRef: setDragNodeRef,
        transform,
        isDragging,
    } = useDraggable({
        id: annotation.data.id,
        data: {
            type: "annotation",
            annotation,
            isInGroup,
        },
    });

    const { setNodeRef: setDropNodeRef, isOver } = useDroppable({
        id: `drop-${annotation.data.id}`,
        data: {
            type: "annotation",
            annotation,
            isInGroup,
        },
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    // Combine the drag and drop refs
    const setNodeRef = (element: HTMLElement | null) => {
        setDragNodeRef(element);
        setDropNodeRef(element);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group bg-card border rounded-lg p-4 transition-all duration-200 cursor-pointer relative ${
                isDragging ? "opacity-50" : ""
            } ${
                isOver && !isDragging ? "ring-2 ring-blue-500 border-blue-500 bg-blue-50/50 dark:bg-blue-950/20" : ""
            } ${
                annotation.data.isOrphaned ? "opacity-60 border-orange-500/30" : ""
            }`}
            onMouseEnter={() => onEmphasize(annotation)}
            onMouseLeave={onClearEmphasize}
        >
            {/* Orphaned indicator */}
            {annotation.data.isOrphaned && (
                <div className="absolute top-2 left-2 text-orange-600 dark:text-orange-400">
                    <AlertCircle className="h-4 w-4" />
                </div>
            )}
            
            {/* Drag handle */}
            <div
                {...listeners}
                {...attributes}
                className="absolute left-2 top-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-grab active:cursor-grabbing"
            >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>

            {/* Delete button */}
            <Button
                variant="ghost"
                size="sm"
                className="absolute top-4 right-4 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(annotation.data.id);
                }}
            >
                <X />
            </Button>

            <div className="flex items-start">
                <div className="flex-1 min-w-0 pr-8 pl-6">
                    {/* Header with type */}
                    <div className="flex items-center gap-2 mb-2">
                        {(() => {
                            const IconComponent = AnnotationIcons[annotation.type];
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

            {/* Drop indicator */}
            {isOver && !isDragging && (
                <div className="absolute inset-0 rounded-lg border-2 border-dashed border-blue-500 bg-blue-50/20 dark:bg-blue-950/30 flex items-center justify-center">
                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-white/90 dark:bg-gray-900/90 px-2 py-1 rounded">
                        Drop to create group
                    </div>
                </div>
            )}
        </div>
    );
}

interface DroppableGroupProps {
    group: AnnotationGroup;
    onDelete: (id: string) => void;
    onDeleteGroup: (groupId: string) => void;
    onToggleExpansion: (groupId: string) => void;
    onUpdateName: (groupId: string, name: string) => void;
    onEmphasize: (annotation: Annotation) => void;
    onClearEmphasize: () => void;
}

function DroppableGroup({ 
    group, 
    onDelete, 
    onDeleteGroup, 
    onToggleExpansion, 
    onUpdateName,
    onEmphasize, 
    onClearEmphasize 
}: DroppableGroupProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(group.name);
    const [showRestoreDialog, setShowRestoreDialog] = useState(false);
    
    // const { clearGridPositions, setGridPositions } = useCharts();
    const { setActiveCompletions } = useLensWorkspace();

    const { setNodeRef, isOver } = useDroppable({
        id: `group-${group.id}`,
        data: {
            type: "group",
            groupId: group.id,
        },
    });

    const handleNameEdit = () => {
        if (isEditing) {
            onUpdateName(group.id, editName);
        } else {
            setEditName(group.name);
        }
        setIsEditing(!isEditing);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleNameEdit();
        } else if (e.key === 'Escape') {
            setEditName(group.name);
            setIsEditing(false);
        }
    };

    const handleRestoreCollection = () => {
        if (!group.workspaceSnapshot) return;
        
        // Clear current workspace and restore from snapshot
        clearGridPositions();
        setGridPositions(group.workspaceSnapshot.gridPositions);
        setActiveCompletions(group.workspaceSnapshot.completions);
        
        setShowRestoreDialog(false);
    };

    return (
        <>
            <div
                ref={setNodeRef}
                className={`bg-card border rounded-lg transition-all duration-200 ${
                    isOver ? "ring-2 ring-blue-500 border-blue-500 bg-blue-50/50 dark:bg-blue-950/20" : ""
                } ${
                    group.workspaceSnapshot ? "border-purple-500/30" : ""
                }`}
            >
                {/* Group header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2 flex-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => onToggleExpansion(group.id)}
                        >
                            {group.isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )}
                        </Button>
                        
                        <FolderOpen className="h-4 w-4 text-muted-foreground" />
                        
                        {isEditing ? (
                            <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onKeyDown={handleKeyPress}
                                onBlur={handleNameEdit}
                                className="h-6 text-sm font-medium"
                                autoFocus
                            />
                        ) : (
                            <span className="text-sm font-medium">{group.name}</span>
                        )}
                        
                        <span className="text-xs text-muted-foreground">
                            ({group.annotations.length})
                        </span>
                        
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 ml-2"
                            onClick={handleNameEdit}
                        >
                            {isEditing ? (
                                <Check className="h-3 w-3" />
                            ) : (
                                <Edit2 className="h-3 w-3" />
                            )}
                        </Button>
                        
                        {/* Restore collection button */}
                        {group.workspaceSnapshot && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 ml-auto mr-2 text-purple-600 dark:text-purple-400"
                                onClick={() => setShowRestoreDialog(true)}
                            >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                <span className="text-xs">Restore</span>
                            </Button>
                        )}
                    </div>
                    
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => onDeleteGroup(group.id)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Collection metadata */}
                {group.isExpanded && (group.description || group.hypothesis) && (
                    <div className="px-4 py-3 border-b bg-muted/30">
                        {group.hypothesis && (
                            <div className="mb-2">
                                <span className="text-xs font-medium text-muted-foreground">Hypothesis:</span>
                                <p className="text-sm mt-1">{group.hypothesis}</p>
                            </div>
                        )}
                        {group.description && (
                            <div>
                                <span className="text-xs font-medium text-muted-foreground">Description:</span>
                                <p className="text-sm mt-1">{group.description}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Group content */}
                {group.isExpanded && (
                    <div className="p-4 space-y-3">
                        {group.annotations.map((annotation) => (
                            <DraggableAnnotation
                                key={annotation.data.id}
                                annotation={annotation}
                                isInGroup={group.id}
                                onDelete={onDelete}
                                onEmphasize={onEmphasize}
                                onClearEmphasize={onClearEmphasize}
                            />
                        ))}
                    </div>
                )}

                {/* Drop indicator for groups */}
                {isOver && (
                    <div className="absolute inset-0 rounded-lg border-2 border-dashed border-blue-500 bg-blue-50/20 dark:bg-blue-950/30 flex items-center justify-center pointer-events-none">
                        <div className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-white/90 dark:bg-gray-900/90 px-2 py-1 rounded">
                            Drop to add to group
                        </div>
                    </div>
                )}
            </div>

            {/* Restore dialog */}
            <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Restore Collection</DialogTitle>
                        <DialogDescription>
                            This will clear your current workspace and restore the saved state from "{group.name}". 
                            Any unsaved work will be lost. Are you sure?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRestoreDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleRestoreCollection}>
                            Restore Collection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

export function Annotations() {
    const {
        annotations,
        groups,
        pendingAnnotation,
        setPendingAnnotation,
        cancelPendingAnnotation,
        deleteAnnotation,
        createGroup,
        createGroupWithSnapshot,
        addAnnotationToGroup,
        deleteGroup,
        toggleGroupExpansion,
        updateGroupName,
        setEmphasizedAnnotation,
        clearEmphasizedAnnotation,
        getUngroupedAnnotations,
    } = useAnnotations();

    const { gridPositions } = useCharts();
    const { completions } = useLensWorkspace();

    const [text, setText] = useState("");
    const [activeId, setActiveId] = useState<string | null>(null);
    const [draggedAnnotation, setDraggedAnnotation] = useState<Annotation | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const ungroupedAnnotations = getUngroupedAnnotations();

    const handleSetPendingAnnotation = () => {
        setPendingAnnotation(text);
        setText("");
    };

    const handleEmphasizedAnnotation = (annotation: Annotation) => {
        setEmphasizedAnnotation(annotation);
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
        const annotation = event.active.data.current?.annotation;
        if (annotation) {
            setDraggedAnnotation(annotation);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        
        if (!over) {
            setActiveId(null);
            setDraggedAnnotation(null);
            return;
        }

        const draggedAnnotationId = active.id as string;
        const draggedData = active.data.current;
        const overData = over.data.current;

        if (!draggedData?.annotation) {
            setActiveId(null);
            setDraggedAnnotation(null);
            return;
        }

        // Handle dropping on another annotation to create a group
        if (overData?.type === "annotation" && overData.annotation.data.id !== draggedAnnotationId) {
            const annotation1 = draggedData.annotation;
            const annotation2 = overData.annotation;
            
            // Create a new group with both annotations and capture workspace snapshot
            const groupName = `Group ${groups.length + 1}`;
            const workspaceSnapshot = {
                gridPositions: [...gridPositions],
                completions: [...completions],
            };
            createGroupWithSnapshot(groupName, [annotation1, annotation2], workspaceSnapshot);
        }
        
        // Handle dropping on a group
        else if (overData?.type === "group") {
            addAnnotationToGroup(draggedAnnotationId, overData.groupId);
        }

        setActiveId(null);
        setDraggedAnnotation(null);
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={rectIntersection}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
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

                    {/* Groups */}
                    {groups.map((group) => (
                        <DroppableGroup
                            key={group.id}
                            group={group}
                            onDelete={deleteAnnotation}
                            onDeleteGroup={deleteGroup}
                            onToggleExpansion={toggleGroupExpansion}
                            onUpdateName={updateGroupName}
                            onEmphasize={handleEmphasizedAnnotation}
                            onClearEmphasize={clearEmphasizedAnnotation}
                        />
                    ))}

                    {/* Ungrouped annotations */}
                    {ungroupedAnnotations.length > 0 && (
                        <div>
                            {groups.length > 0 && (
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-sm font-medium text-muted-foreground">
                                        Ungrouped Annotations
                                    </span>
                                    <div className="flex-1 h-px bg-border" />
                                </div>
                            )}
                            
                            <div className="space-y-3">
                                {ungroupedAnnotations.map((annotation) => (
                                    <DraggableAnnotation
                                        key={annotation.data.id}
                                        annotation={annotation}
                                        onDelete={deleteAnnotation}
                                        onEmphasize={handleEmphasizedAnnotation}
                                        onClearEmphasize={clearEmphasizedAnnotation}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty state */}
                    {ungroupedAnnotations.length === 0 && groups.length === 0 && !pendingAnnotation && (
                        <div className="text-center py-8">
                            <p className="text-sm text-muted-foreground">No annotations yet</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Click on a chart to add annotations
                            </p>
                        </div>
                    )}

                    {/* Instructions */}
                    {(ungroupedAnnotations.length > 1 || groups.length > 0) && (
                        <div className="text-center py-4 border-t">
                            <p className="text-xs text-muted-foreground">
                                Drag annotations onto each other to create groups
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <DragOverlay>
                {draggedAnnotation && (
                    <div className="bg-card border rounded-lg p-4 shadow-lg rotate-3 scale-105">
                        <div className="flex items-center gap-2 mb-2">
                            {(() => {
                                const IconComponent = AnnotationIcons[draggedAnnotation.type];
                                return (
                                    <IconComponent className="h-4 w-4 text-muted-foreground" />
                                );
                            })()}
                            <span className="inline-flex items-center py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                                {AnnotationTitle[draggedAnnotation.type]}
                            </span>
                        </div>
                        <p className="text-sm text-foreground">
                            {draggedAnnotation.data.text}
                        </p>
                    </div>
                )}
            </DragOverlay>
        </DndContext>
    );
}
