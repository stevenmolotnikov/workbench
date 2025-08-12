"use client";

import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Grid3X3, ChartLine, Search, ReplaceAll, Trash2 } from "lucide-react";
import Image from "next/image";
import { ChartMetadata } from "@/types/charts";

export type ChartCardProps = {
    metadata: ChartMetadata;
    handleDelete: (e: React.MouseEvent, chartId: string) => void;
    canDelete: boolean;
};

export default function ChartCard({ metadata, handleDelete, canDelete }: ChartCardProps) {
    const { workspaceId, chartId } = useParams<{ workspaceId: string, chartId: string }>();

    const isSelected = chartId === metadata.id;
    const router = useRouter();
    const createdAt = metadata.createdAt ? new Date(metadata.createdAt).toLocaleDateString() : "";

    const navigateToChart = (chartId: string) => {
        router.push(`/workbench/${workspaceId}/${chartId}`);
    };

    const handleChartClick = (metadata: ChartMetadata) => {
        navigateToChart(metadata.id);
    };

    const formatToolType = (toolType: ChartMetadata["toolType"]) => {
        if (!toolType) return "Unknown";
        return toolType === "lens" ? "Lens" : toolType === "patch" ? "Patch" : toolType;
    };

    const renderToolIcon = (toolType: ChartMetadata["toolType"]) => {
        if (toolType === "lens") return <Search className="h-4 w-4" />;
        if (toolType === "patch") return <ReplaceAll className="h-4 w-4" />;
        return <Search className="h-4 w-4 opacity-50" />;
    };

    const renderChartTypeMini = (chartType: ChartMetadata["chartType"]) => {
        if (chartType === "line") return (
            <span className="inline-flex items-center gap-1">
                <ChartLine className="h-3 w-3" />
                <span>Line</span>
            </span>
        );
        if (chartType === "heatmap") return (
            <span className="inline-flex items-center gap-1">
                <Grid3X3 className="h-3 w-3" />
                <span>Heatmap</span>
            </span>
        );
        return (
            <span className="inline-flex items-center gap-1 opacity-60">
                <Grid3X3 className="h-3 w-3" />
                <span>unknown</span>
            </span>
        );
    };

    const Thumbnail = ({ url }: { url: string | null | undefined }) => {
        if (!url) {
            return (
                <div className="w-12 h-8 rounded bg-muted flex items-center justify-center text-[10px] text-muted-foreground">img</div>
            );
        }
        return (
            <div className="relative w-14 h-14 overflow-hidden rounded border">
                <Image
                    src={url}
                    alt="chart thumbnail"
                    fill
                    sizes="48px"
                    style={{ objectFit: "cover" }}
                    loading="lazy"
                    placeholder="empty"
                />
            </div>
        );
    };

    return (
        <Card
            key={metadata.id}
            className={`p-3 cursor-pointer rounded transition-all ${isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
            onClick={() => handleChartClick(metadata)}
            draggable
            onDragStart={(e) => {
                try {
                    e.dataTransfer.setData(
                        "application/x-chart",
                        JSON.stringify({ chartId: metadata.id, chartType: metadata.chartType ?? null })
                    );
                    e.dataTransfer.effectAllowed = "copy";
                } catch { }
            }}
        >
            <div className="flex items-start gap-2">
                <Thumbnail url={metadata.thumbnailUrl} />
                <div className="mt-1">
                    {renderToolIcon(metadata.toolType)}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium capitalize">
                            {formatToolType(metadata.toolType)}
                        </span>
                        {createdAt && (
                            <span className="text-xs text-muted-foreground">{createdAt}</span>
                        )}
                    </div>
                    <div className="text-xs text-muted-foreground break-words flex items-center gap-2">
                        {renderChartTypeMini(metadata.chartType)}
                    </div>
                </div>
                <button
                    className={`p-1 rounded hover:bg-muted ${!canDelete ? "opacity-40 cursor-not-allowed" : ""}`}
                    onClick={(e) => handleDelete(e, metadata.id)}
                    disabled={!canDelete}
                    aria-label="Delete chart"
                >
                    <Trash2 className="h-3 w-3" />
                </button>
            </div>
        </Card>
    );
}