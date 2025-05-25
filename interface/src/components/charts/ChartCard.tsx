import { X, Play, Settings2 } from "lucide-react";

interface ChartCardProps {
    handleRunChart: () => void;
    handleConfigChart: () => void;
    handleRemoveChart: () => void;
    isLoading: boolean;
    children: React.ReactNode;
}

export function ChartCard({
    handleRunChart,
    handleConfigChart,
    handleRemoveChart,
    isLoading,
    children,
}: ChartCardProps) {
    return (
        <div className="h-full border rounded-lg">
            <div className="absolute top-2 right-2 flex gap-1 z-10">
                <button
                    onClick={handleRunChart}
                    className="p-1 rounded-full hover:bg-muted transition-colors"
                    title="Run chart"
                    disabled={isLoading}
                >
                    <Play className="h-4 w-4 text-muted-foreground" />
                </button>
                <button
                    onClick={handleConfigChart}
                    className="p-1 rounded-full hover:bg-muted transition-colors"
                    title="Configure chart"
                >
                    <Settings2 className="h-4 w-4 text-muted-foreground" />
                </button>
                <button
                    onClick={handleRemoveChart}
                    className="p-1 rounded-full hover:bg-muted transition-colors"
                    title="Remove chart"
                >
                    <X className="h-4 w-4 text-muted-foreground" />
                </button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-full">
                    <div className="text-muted-foreground">Loading...</div>
                </div>
            ) : (
                children
            )}
        </div>
    );
}
