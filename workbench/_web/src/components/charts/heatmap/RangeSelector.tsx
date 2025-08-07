"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DoubleSlider } from "@/components/ui/double-slider";
import { X, ChevronDown, Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type Range = [number, number];

type RangeWithId = {
    id: string;
    range: Range;
};

interface RangeSelectorProps {
    min: number;
    max: number;
    ranges: RangeWithId[];
    onRangesChange: (ranges: RangeWithId[]) => void;
    maxRanges?: number;
    axisLabel: string;
    className?: string;
}

export function RangeSelector({
    min,
    max,
    ranges,
    onRangesChange,
    maxRanges = 5,
    axisLabel,
    className,
}: RangeSelectorProps) {
    const [currentRange, setCurrentRange] = useState<Range>([min, max]);
    const [isAddingRange, setIsAddingRange] = useState(ranges.length === 0);
    const [open, setOpen] = useState(false);

    const handleAddRange = () => {
        if (ranges.length >= maxRanges) return;

        const newRange: RangeWithId = {
            id: `range-${Date.now()}`,
            range: currentRange,
        };

        onRangesChange([...ranges, newRange]);
        setCurrentRange([min, max]);
        setIsAddingRange(false);
    };

    const handleDeleteRange = (id: string) => {
        const newRanges = ranges.filter(r => r.id !== id);
        onRangesChange(newRanges);
    };

    const handleCancelAdd = () => {
        // if (ranges.length === 0) {
        //     setOpen(false);
        // }
        setCurrentRange([min, max]);
        setIsAddingRange(false);
    };

    const handleOpenChange = (open: boolean) => {
        setOpen(open);
        if (open && ranges.length === 0) {
            setIsAddingRange(true);
        }
    };

    return (
        <DropdownMenu open={open} onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-between", className)}>
                    {axisLabel}
                    <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 !p-0">
                {!isAddingRange && (
                    <>
                        <DropdownMenuLabel className="flex items-center border-b justify-between">
                            <span>Ranges</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => setIsAddingRange(true)}
                                disabled={ranges.length >= maxRanges}
                            >
                                <Plus className="h-3 w-3" />
                            </Button>
                        </DropdownMenuLabel>

                        {
                            ranges.length > 0 ? (
                                <>
                                    {ranges.map((range) => (
                                        <div
                                            key={range.id}
                                            className="flex items-center justify-between px-2 py-1 bg-secondary/50"
                                        >
                                            <span className="text-sm font-medium">
                                                {range.range[0]} - {range.range[1]}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() => handleDeleteRange(range.id)}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <div className="text-sm text-muted-foreground px-2 py-2">No ranges selected</div>
                            )
                        }

                    </>
                )}

                {(ranges.length < maxRanges && isAddingRange) && (
                    <>
                        <DropdownMenuLabel>
                            <div className="flex items-center justify-between">
                                <span>
                                    New Range
                                </span>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCancelAdd}>
                                        <X className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={handleAddRange}
                                        disabled={currentRange[0] >= currentRange[1]}
                                    >
                                        <Check className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        <div className="space-y-2 px-2 pb-3">
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Min: {currentRange[0]}</span>
                                <span>Max: {currentRange[1]}</span>
                            </div>
                            <DoubleSlider
                                value={currentRange}
                                onValueChange={setCurrentRange}
                                min={min}
                                max={max}
                                step={1}
                                className="w-full"
                            />
                        </div>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}