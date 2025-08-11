"use client";

import { useEffect, useMemo, useState } from "react";
import { usePatch } from "./PatchProvider";
import type { RangeGroup } from "./PatchProvider";

export function useTokenHighlight(side: "source" | "destination") {
    const {
        mainMode,
        sourceAlignedIdxs,
        destAlignedIdxs,
        setSourceAlignedIdxs,
        setDestAlignedIdxs,
    } = usePatch();

    const indicesToGroups = (idxs: Set<number>): RangeGroup[] => {
        if (idxs.size === 0) return [];
        const sorted = Array.from(idxs).sort((a, b) => a - b);
        const groups: RangeGroup[] = [];
        let start = sorted[0];
        let end = start;
        for (let i = 1; i < sorted.length; i++) {
            const v = sorted[i];
            if (v === end + 1) {
                end = v;
            } else {
                groups.push({ start, end });
                start = end = v;
            }
        }
        groups.push({ start, end });
        return groups;
    };

    const alignGroups = useMemo(
        () => indicesToGroups(side === "source" ? sourceAlignedIdxs : destAlignedIdxs),
        [side, sourceAlignedIdxs, destAlignedIdxs]
    );

    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionStartIdx, setSelectionStartIdx] = useState<number | null>(null);
    const [selectionHoverIdx, setSelectionHoverIdx] = useState<number | null>(null);

    const isIdxInAnyGroup = (idx: number): boolean => {
        for (const g of alignGroups) {
            if (idx >= Math.min(g.start, g.end) && idx <= Math.max(g.start, g.end)) return true;
        }
        return false;
    };

    const addAlignedRange = (start: number, end: number) => {
        const lo = Math.min(start, end);
        const hi = Math.max(start, end);
        if (side === "source") {
            setSourceAlignedIdxs((prev) => {
                const next = new Set(prev);
                for (let i = lo; i <= hi; i++) next.add(i);
                return next;
            });
        } else {
            setDestAlignedIdxs((prev) => {
                const next = new Set(prev);
                for (let i = lo; i <= hi; i++) next.add(i);
                return next;
            });
        }
    };

    const toggleAligned = (idx: number) => {
        if (side === "source") {
            setSourceAlignedIdxs((prev) => {
                const next = new Set(prev);
                if (next.has(idx)) next.delete(idx);
                else next.add(idx);
                return next;
            });
        } else {
            setDestAlignedIdxs((prev) => {
                const next = new Set(prev);
                if (next.has(idx)) next.delete(idx);
                else next.add(idx);
                return next;
            });
        }
    };

    const finalizeSelection = (endIdx: number | null) => {
        if (!(mainMode === "align" && isSelecting && selectionStartIdx !== null)) return;
        const start = selectionStartIdx;
        const end = endIdx ?? selectionHoverIdx ?? selectionStartIdx;
        if (end === null) return;
        addAlignedRange(start, end);
        setIsSelecting(false);
        setSelectionStartIdx(null);
        setSelectionHoverIdx(null);
    };

    const onHighlightEnd = (idx: number) => {
        if (selectionStartIdx !== null && selectionStartIdx === idx && selectionHoverIdx === idx) {
            const isInGroup = isIdxInAnyGroup(idx);
            if (isInGroup) {
                toggleAligned(idx);
                setIsSelecting(false);
                setSelectionStartIdx(null);
                setSelectionHoverIdx(null);
                return;
            }
        }
        finalizeSelection(idx);
    };

    const isInLiveSelection = (idx: number) => mainMode === "align" && isSelecting && selectionStartIdx !== null && selectionHoverIdx !== null && idx >= Math.min(selectionStartIdx, selectionHoverIdx) && idx <= Math.max(selectionStartIdx, selectionHoverIdx);

    useEffect(() => {
        if (!isSelecting) return;
        const onUp = () => finalizeSelection(selectionHoverIdx);
        window.addEventListener("mouseup", onUp);
        return () => window.removeEventListener("mouseup", onUp);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSelecting, selectionHoverIdx, mainMode, side]);

    return {
        isSelecting,
        isInLiveSelection,
        setIsSelecting,
        setSelectionStartIdx,
        setSelectionHoverIdx,
        isIdxInAnyGroup,
        onHighlightEnd,
    } as const;
}

export type UseTokenHighlight = ReturnType<typeof useTokenHighlight>;


