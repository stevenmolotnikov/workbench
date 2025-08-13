"use client";

import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Grid3X3, ChartLine, Search, ReplaceAll, Trash2 } from "lucide-react";
import Image from "next/image";
import { ChartMetadata } from "@/types/charts";
import { cn } from "@/lib/utils";

export type ChartCardProps = {
    metadata: ChartMetadata;
    handleDelete: (e: React.MouseEvent, chartId: string) => void;
    canDelete: boolean;
};

export default function ChartCard({ metadata, handleDelete, canDelete }: ChartCardProps) {
    const { workspaceId, chartId } = useParams<{ workspaceId: string, chartId: string }>();

    const isSelected = chartId === metadata.id;
    const router = useRouter();
    const updatedAt = metadata.updatedAt ? new Date(metadata.updatedAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }) : "";

    const navigateToChart = (chartId: string) => {
        router.push(`/workbench/${workspaceId}/${chartId}`);
    };

    const handleChartClick = (metadata: ChartMetadata) => {
        navigateToChart(metadata.id);
    };

    // const formatToolType = (toolType: ChartMetadata["toolType"]) => {
    //     if (!toolType) return "Unknown";
    //     return toolType === "lens" ? "Lens" : toolType === "patch" ? "Patch" : toolType;
    // };


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

        const style = cn(
            "relative w-[35%] h-24 overflow-hidden rounded-l border-y border-r",
            isSelected && "border-primary"
        )

        if (!url) {
            return (
                <div className={style}>

                </div>
            );
        }
        const version = metadata.updatedAt ? new Date(metadata.updatedAt).getTime() : undefined;
        const versionedUrl = version ? `${url}${url.includes("?") ? "&" : "?"}v=${version}` : url;
        return (
            <div className={style}>
                <Image
                    src={versionedUrl}
                    alt="chart thumbnail"
                    fill
                    sizes="48px"
                    style={{ objectFit: "cover", objectPosition: "bottom" }}
                    loading="lazy"
                    placeholder="empty"
                />
            </div>
        );
    };

    return (
        <div
            className={cn(
                "flex items-center border h-24 rounded",
                isSelected && "border-primary"
            )}
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
            <Thumbnail url={metadata.thumbnailUrl} />
            <div
                key={metadata.id}
                className={cn(
                    "p-3 cursor-pointer transition-all h-full w-[65%]",
                    isSelected ? "bg-primary/5" : "hover:bg-muted/50"
                )}
            >
                <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium capitalize">
                                {/* {formatToolType(metadata.toolType)} */}
                                {metadata.name ? (metadata.name.length > 12 ? `${metadata.name.slice(0, 12)}...` : metadata.name) : 'Untitled'}
                            </span>

                        </div>
                        <div className="text-xs text-muted-foreground break-words flex items-center gap-2">

                            {renderChartTypeMini(metadata.chartType)}
                            {updatedAt && renderChartTypeMini(metadata.chartType) && (
                                <span className="text-xs text-muted-foreground">•</span>
                            )}

                            {updatedAt && (
                                <span className="text-xs text-muted-foreground">{updatedAt}</span>
                            )}
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
            </div>
        </div>
    );
}