import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChartMode } from "@/types/workspace";
import { useCharts } from "@/stores/useCharts";

interface SelectionMenuProps {
    modes: ChartMode[];
    setConfiguringPosition: (position: number | null) => void;
}

export function SelectionMenu({
    modes,
    setConfiguringPosition,
}: SelectionMenuProps) {
    const {
        setSelectedChartType,
        setSelectionPhase,
    } = useCharts();

    const handleChartTypeSelection = (chartTypeIndex: number) => {
        setSelectedChartType(chartTypeIndex);
        setSelectionPhase('destination');
    };
    return (
        <div className="absolute inset-0 z-20 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-background/50 backdrop-blur-sm"
                onClick={() => {
                    setConfiguringPosition(null);
                    setSelectionPhase(null);
                    setSelectedChartType(null);
                }}
            ></div>
            {/* Selection Panel */}
            <Card className="relative max-w-md w-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle>Select Visualization</CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-auto rounded-full"
                        onClick={() => {
                            setConfiguringPosition(null);
                            setSelectionPhase(null);
                            setSelectedChartType(null);
                        }}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        {modes.map((mode, index) => (
                            <Card
                                key={index}
                                className={cn(
                                    "flex flex-col items-center transition-colors rounded-md border",
                                    "cursor-pointer hover:bg-muted/60 hover:border-muted-foreground/50"
                                )}
                                onClick={() => {
                                    handleChartTypeSelection(index);
                                }}
                            >
                                <CardContent className="p-4 flex flex-col items-center">
                                    <div className="mb-2 text-muted-foreground">
                                        <mode.icon />
                                    </div>
                                    <p className="text-sm font-medium text-center">
                                        {mode.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground text-center mt-1">
                                        {mode.description}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}