import { Card } from "@/components/ui/card";
import { Layers, Grid3X3 } from "lucide-react";
import { LineAnnotation, HeatmapAnnotation } from "@/types/annotations";
import type { Annotation, Chart } from "@/db/schema";

type AnnotationWithChart = Annotation & { chart: Chart };

interface AnnotationCardProps {
    annotation: AnnotationWithChart;
    isSelected: boolean;
    onClick: () => void;
}

export function AnnotationCard({ 
    annotation, 
    isSelected, 
    onClick 
}: AnnotationCardProps) {
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