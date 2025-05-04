import { useState } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { LogitLensModes } from "@/components/workbench/modes"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LayoutGrid } from "lucide-react"
import { TestChart } from "@/components/charts/TestChart"
import { Plus } from "lucide-react"
import { LogitLensResponse } from "../workbench/conversation.types"


interface ChartSelectorProps {
    setConfiguringPosition: (position: number | null) => void;
    isChartSelected: (index: number) => boolean;
    handleAddChart: (index: number) => void;
}


function Selector({ setConfiguringPosition, isChartSelected, handleAddChart }: ChartSelectorProps) {
    return (

        <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-background/50 backdrop-blur-sm"
                onClick={() => setConfiguringPosition(null)}
            ></div>
            {/* Selection Panel */}
            <Card className="relative max-w-md w-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle>Select Visualization</CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-auto"
                        onClick={() => setConfiguringPosition(null)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        {LogitLensModes.map((mode, index) => (
                            <Card
                                key={index}
                                className={cn(
                                    "flex flex-col items-center transition-colors border",
                                    isChartSelected(index)
                                        ? "opacity-50 cursor-not-allowed bg-muted/30"
                                        : "cursor-pointer hover:bg-muted/60 hover:border-muted-foreground/50"
                                )}
                                onClick={() => {
                                    if (!isChartSelected(index)) {
                                        handleAddChart(index);
                                    }
                                }}
                            >
                                <CardContent className="p-4 flex flex-col items-center">
                                    <div className="mb-2 text-muted-foreground">
                                        {mode.icon}
                                    </div>
                                    <p className="text-sm font-medium text-center">{mode.name}</p>
                                    <p className="text-xs text-muted-foreground text-center mt-1">{mode.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}


type Layout = "1x1" | "1x2" | "2x2";

interface ChartSelectorProps {
    chartData: LogitLensResponse;
    isLoading: boolean;
}

export function ChartSelector({chartData, isLoading}: ChartSelectorProps) {

    const [layout, setLayout] = useState<Layout>("1x1")
    const [selectedModes, setSelectedModes] = useState<(number | undefined)[]>([])
    const [configuringPosition, setConfiguringPosition] = useState<number | null>(null)

    const isChartSelected = (modeIndex: number) => {
        return selectedModes.includes(modeIndex);
    }

    const getLayoutGrid = () => {
        switch (layout) {
            case "1x1":
                return "grid-cols-1";
            case "1x2":
                return "grid-cols-2";
            case "2x2":
                return "grid-cols-2 grid-rows-2";
            default:
                return "grid-cols-1";
        }
    }

    const getBoxCount = () => {
        switch (layout) {
            case "1x1":
                return 1;
            case "1x2":
                return 2;
            case "2x2":
                return 4;
            default:
                return 1;
        }
    }

    const handleAddChart = (modeIndex: number) => {
        if (configuringPosition === null) return;

        setSelectedModes(prev => {
            const newModes = [...prev];
            newModes[configuringPosition] = modeIndex;
            return newModes;
        });
        setConfiguringPosition(null);
    }

    const handleRemoveChart = (position: number) => {
        setSelectedModes(prev => {
            const newModes = [...prev];
            newModes[position] = undefined;
            return newModes;
        });
    }


    return (
        <div className="flex-1 flex flex-col overflow-hidden custom-scrollbar bg-muted relative">
            {/* Padded container for charts only */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-2 z-10 absolute bottom-2 right-2">
                        <LayoutGrid size={16} />
                        Layout
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setLayout("1x1")}>
                        1x1
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLayout("1x2")}>
                        1x2
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLayout("2x2")}>
                        2x2
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex-1 overflow-auto p-4 ">
                <div className={`grid ${getLayoutGrid()} gap-4 h-full`}>
                    {Array.from({ length: getBoxCount() }).map((_, index) => (
                        <div key={index} className="h-full relative">
                            {selectedModes[index] !== undefined ? (
                                <div className="h-full">
                                    <button
                                        onClick={() => handleRemoveChart(index)}
                                        className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors z-10"
                                    >
                                        <X className="h-4 w-4 text-muted-foreground" />
                                    </button>
                                    <TestChart
                                        title={LogitLensModes[selectedModes[index]!].name}
                                        description={LogitLensModes[selectedModes[index]!].description}
                                        data={chartData}
                                        isLoading={isLoading}
                                    />
                                </div>
                            ) : (
                                <div
                                    className="flex flex-col items-center justify-center h-full border border-dashed rounded-lg p-8 cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => {
                                        setConfiguringPosition(index);
                                    }}
                                >
                                    <div className="flex items-center gap-1">
                                        <p className="text-sm font-medium text-muted-foreground">Add a chart</p>
                                        <Plus className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Inline Chart Selector Overlay */}
            {configuringPosition !== null && (
                <Selector
                    setConfiguringPosition={setConfiguringPosition}
                    isChartSelected={isChartSelected}
                    handleAddChart={handleAddChart}
                />
            )}
        </div>
    )
}