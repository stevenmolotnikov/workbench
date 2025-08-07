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
import { X, ChevronDown } from "lucide-react";

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
}

export function RangeSelector({
    min,
    max,
    ranges,
    onRangesChange,
    maxRanges = 5,
    axisLabel,
}: RangeSelectorProps) {
    const [currentRange, setCurrentRange] = useState<Range>([min, max]);
    const [isAddingRange, setIsAddingRange] = useState(false);

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
        onRangesChange(ranges.filter(r => r.id !== id));
    };

    const handleCancelAdd = () => {
        setCurrentRange([min, max]);
        setIsAddingRange(false);
    };

    const getTriggerText = () => {
        if (ranges.length === 0) {
            return `${axisLabel}: No ranges`;
        }
        return `${axisLabel}: ${ranges.length} range${ranges.length > 1 ? 's' : ''}`;
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                    <span>{getTriggerText()}</span>
                    <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80">
                {ranges.length > 0 && (
                    <>
                        <DropdownMenuLabel>Selected Ranges</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <div className="p-2 space-y-2">
                            {ranges.map((range) => (
                                <div
                                    key={range.id}
                                    className="flex items-center justify-between p-2 rounded-md bg-secondary/50 hover:bg-secondary/70 transition-colors"
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
                        </div>
                    </>
                )}

                {ranges.length < maxRanges && (
                    <>
                        {ranges.length > 0 && <DropdownMenuSeparator />}
                        <DropdownMenuLabel>
                            {isAddingRange ? "New Range" : "Add Range"}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        <div className="p-4 space-y-4">
                            {!isAddingRange ? (
                                <Button
                                    className="w-full"
                                    onClick={() => setIsAddingRange(true)}
                                    disabled={ranges.length >= maxRanges}
                                >
                                    Add New Range
                                </Button>
                            ) : (
                                <>
                                    <div className="space-y-2">
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
                                    
                                    <div className="flex gap-2">
                                        <Button
                                            className="flex-1"
                                            onClick={handleAddRange}
                                            disabled={currentRange[0] >= currentRange[1]}
                                        >
                                            Confirm
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="flex-1"
                                            onClick={handleCancelAdd}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </>
                )}

                {ranges.length >= maxRanges && (
                    <div className="p-3 text-sm text-muted-foreground text-center">
                        Maximum {maxRanges} ranges reached
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}