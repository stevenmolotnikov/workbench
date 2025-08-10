"use client";

import { Button } from "@/components/ui/button";
import { RangeSelector } from "../RangeSelector";
import { Search, RotateCcw } from "lucide-react";
import { useHeatmap } from "./HeatmapProvider";
import { useState } from "react";
import { useZoom } from "./ZoomProvider";
import { useAnnotations } from "@/stores/useAnnotations";

export function HeatmapControls() {

  const { setPendingAnnotation } = useAnnotations();

  const {
    bounds: { xMin, xMax, yMin, yMax },
    xRanges,
    yRanges,
    setXRanges,
    setYRanges,
    xStepInput,
    setXStepInput,
  } = useHeatmap();

  const { setIsZoomSelecting, isZoomSelecting, toggleZoomSelecting } = useZoom();

  // Handle reset
  const handleReset = () => {
    setXRanges([]);
    setYRanges([]);
    setIsZoomSelecting(false);
    setPendingAnnotation(null);
    setXStepInput(1);
  };

  const [title, setTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  return (
    <div className="flex h-[10%] gap-2 p-4 lg:p-8 justify-between">
      {isEditingTitle ? (
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => setIsEditingTitle(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setIsEditingTitle(false);
            }
          }}
          placeholder="Untitled Chart"
          className="text-xl font-bold p-0 m-0 border-primary border overflow-clip rounded bg-transparent w-64"
          autoFocus
        />
      ) : (
        <h1
          className="text-xl font-bold cursor-pointer border rounded border-transparent w-64 overflow-clip items-center flex hover:border-border transition-opacity p-0 m-0"
          onClick={() => setIsEditingTitle(true)}
        >
          {title || "Untitled Chart"}
        </h1>
      )}
      <div className="flex items-center gap-2">
        <RangeSelector
          min={xMin}
          max={xMax}
          ranges={xRanges}
          onRangesChange={setXRanges}
          maxRanges={1}
          axisLabel="X Range"
          step={xStepInput}
        />
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={Math.max(1, xMax - xMin)}
            step={1}
            value={xStepInput}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (Number.isNaN(val)) {
                setXStepInput(1);
              } else {
                setXStepInput(Math.max(1, Math.min(val, Math.max(1, xMax - xMin))));
              }
            }}
            className="w-20 h-8 border rounded px-2 text-xs bg-background"
            aria-label="X Range Step"
            title="X Range Step"
          />
        </div>

        <RangeSelector
          min={yMin}
          max={yMax}
          ranges={yRanges}
          onRangesChange={setYRanges}
          maxRanges={1}
          axisLabel="Y Range"
        />

        <Button
          variant={isZoomSelecting ? "default" : "outline"}
          size="icon"
          onClick={() => toggleZoomSelecting()}
          aria-pressed={isZoomSelecting}
          title={isZoomSelecting ? "Exit zoom selection" : "Enter zoom selection"}
        >
          <Search className="w-4 h-4" />
        </Button>

        <Button variant="outline" size="icon" onClick={handleReset} title="Reset ranges">
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
