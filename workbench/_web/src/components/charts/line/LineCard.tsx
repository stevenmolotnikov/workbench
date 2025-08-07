import { useState } from "react";
import { LineGraphData } from "@/types/charts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pencil, Settings } from "lucide-react";
import { Line } from "./Line";

interface LineCardProps {
    data: LineGraphData
}

export const LineCard = ({ data }: LineCardProps) => {
    const [title, setTitle] = useState("Title");
    const [isEditingTitle, setIsEditingTitle] = useState(false);

    const [xRange, setXRange] = useState<[number, number] | undefined>(undefined);
    const [yRange, setYRange] = useState<[number, number] | undefined>(undefined);

    return (
        <div className="flex flex-col h-full p-4">
            <div className="flex h-[10%] items-center gap-2">
                {isEditingTitle ? (
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={() => setIsEditingTitle(false)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                setIsEditingTitle(false);
                            }
                        }}
                        className="text-xl font-bold h-auto py-0 px-1 w-fit"
                        autoFocus
                    />
                ) : (
                    <h1 className="text-xl font-bold">
                        {title}
                    </h1>
                )}

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setIsEditingTitle(true)}
                >
                    <Pencil className="h-4 w-4" />
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-8 w-8">
                            <Settings className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                        <DropdownMenuLabel>Axis Limits</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        <div className="p-2 space-y-3">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">X Axis</label>
                                <div className="flex gap-2">
                                    <Input
                                        type="number"
                                        placeholder="Min"
                                        value={xRange?.[0] ?? ""}
                                        onChange={(e) => setXRange([Number(e.target.value), xRange?.[1] ?? 0])}
                                        className="h-8"
                                    />
                                    <Input
                                        type="number"
                                        placeholder="Max"
                                        value={xRange?.[1] ?? ""}
                                        onChange={(e) => setXRange([xRange?.[0] ?? 0, Number(e.target.value)])}
                                        className="h-8"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Y Axis</label>
                                <div className="flex gap-2">
                                    <Input
                                        type="number"
                                        placeholder="Min"
                                        value={yRange?.[0] ?? ""}
                                        onChange={(e) => setYRange([Number(e.target.value), yRange?.[1] ?? 0])}
                                        className="h-8"
                                    />
                                    <Input
                                        type="number"
                                        placeholder="Max"
                                        value={yRange?.[1] ?? ""}
                                        onChange={(e) => setYRange([yRange?.[0] ?? 0, Number(e.target.value)])}
                                        className="h-8"
                                    />
                                </div>
                            </div>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="flex h-[90%] w-full rounded">
                <Line 
                    data={data} 
                />
            </div>
        </div>
    )
}

