import { X, Play, Settings2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BorderBeam } from "@/components/magicui/border-beam";

interface ChartCardProps {
    handleRunChart: () => void;
    handleRemoveChart: () => void;
    isLoading: boolean;
    chartTitle: React.ReactNode;
    chart: React.ReactNode;
    configContent?: React.ReactNode;
    showRunButton?: boolean;
    showRemoveButton?: boolean;
}

export function ChartCard({
    handleRunChart,
    handleRemoveChart,
    isLoading,
    chartTitle,
    chart,
    configContent = null,
    showRunButton = true,
    showRemoveButton = true,
}: ChartCardProps) {
    const CardMenu = () => {
        return (
            <div className="absolute top-2 right-2 flex gap-1 z-10">
            {showRunButton &&
                <button
                    onClick={handleRunChart}
                    className="p-1 rounded-full hover:bg-muted transition-colors"
                    title="Run chart"
                    disabled={isLoading}
                >
                    <Play className="h-4 w-4 text-muted-foreground" />
                </button>
            }
            {configContent && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            className="p-1 rounded-full hover:bg-muted transition-colors"
                            title="Configure chart"
                        >
                            <Settings2 className="h-4 w-4 text-muted-foreground" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>{configContent}</DropdownMenuContent>
                </DropdownMenu>
            )}

            {showRemoveButton &&
                <button
                    onClick={handleRemoveChart}
                    className="p-1 rounded-full hover:bg-muted transition-colors"
                    title="Remove chart"
                >
                    <X className="h-4 w-4 text-muted-foreground" />
                </button>
            }
        </div>
        )
    }

    return (
        <div className="h-full flex flex-col border rounded-lg p-4 justify-between">
            {chartTitle}
            <CardMenu />
            {isLoading ? (
                <>
                    <div className="flex items-center justify-center h-full">
                        <div className="text-muted-foreground">Loading...</div>
                    </div>
                    <BorderBeam
                        duration={5}
                        size={300}
                        className="from-transparent bg-primary to-transparent"
                    />
                </>
            ) : (
                chart
            )}
        </div>
    );
}
