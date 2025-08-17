import { useLineData } from "./LineDataProvider";
import { lineColors } from "../theming";
import { cn } from "@/lib/utils";
import { useCrosshair } from "./useCrosshair";

export const TooltipAtX = ({  rafRef }: { rafRef: React.MutableRefObject<number | null> }) => {
    const { data } = useLineData();

    const {nearestLineIdAtX, hoverSnappedXPx, hoverXRaw} = useCrosshair({ rafRef });

    return (
        <div
            className="absolute top-[5%] z-30 pointer-events-none"
            style={{ left: Math.max(0, hoverSnappedXPx - 80) }}
        >
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs rounded px-2 py-1 shadow-sm whitespace-nowrap">
                <div className="font-medium mb-1">x = {String(hoverXRaw)}</div>
                {data.lines.map((line, index) => {
                    const p = line.data.find(pt => pt.x === hoverXRaw);
                    if (!p) return null;
                    const isNearest = nearestLineIdAtX && String(line.id) === nearestLineIdAtX;
                    const color = lineColors[index % lineColors.length];
                    return (
                        <div key={String(line.id)} className="flex items-center gap-2">
                            <span className={cn(
                                "w-3 h-1 rounded-full",
                                isNearest ? "opacity-100" : "opacity-25"
                            )} style={{ backgroundColor: color }} />
                            <span className={isNearest ? "font-bold" : undefined}>
                                {line.id}: {p.y.toFixed(3)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

