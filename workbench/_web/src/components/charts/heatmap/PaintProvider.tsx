import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useHeatmapControls } from "./HeatmapControlsProvider";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAnnotations } from "@/lib/queries/annotationQueries";
import type { Annotation } from "@/db/schema";
import type { HeatmapAnnotation } from "@/types/annotations";
import { getCellFromPosition } from "./heatmap-geometry";
import usePaintCanvas from "./usePaintCanvas";
import { useCreateAnnotation, useUpdateAnnotation } from "@/lib/api/annotationsApi";
import { useDebouncedCallback } from "use-debounce";

interface PaintContextValue {
    paintCanvasRef: React.RefObject<HTMLCanvasElement>
}

const PaintContext = createContext<PaintContextValue | null>(null)

export const usePaint = () => {
    const ctx = useContext(PaintContext)
    if (!ctx) throw new Error("usePaint must be used within a PaintProvider")
    return ctx
}

export const PaintProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const paintCanvasRef = useRef<HTMLCanvasElement>(null)
    const { filteredData: data, isZoomSelecting } = useHeatmapControls()
    const { chartId } = useParams<{ chartId: string }>()

    const queryClient = useQueryClient()
    const { data: allAnnotations = [] } = useQuery<Annotation[]>({
        queryKey: ["annotations", chartId],
        queryFn: () => getAnnotations(chartId!),
        enabled: !!chartId,
    })

    const [pendingAdditions, setPendingAdditions] = useState<Set<string>>(new Set())
    const dragStartRef = useRef<{ x: number; y: number } | null>(null)

    const highlightedCellIds = useMemo<Set<string>>(() => {
        const next = new Set<string>()
        for (const ann of allAnnotations) {
            if (ann.type !== 'heatmap') continue
            const hm = ann.data as HeatmapAnnotation
            hm.cellIds.forEach(id => next.add(id))
        }
        pendingAdditions.forEach(id => next.add(id))
        return next
    }, [allAnnotations, pendingAdditions])

    // Resize canvas for DPR
    useEffect(() => {
        const canvas = paintCanvasRef.current
        if (!canvas) return
        const update = () => {
            const rect = canvas.getBoundingClientRect()
            const dpr = window.devicePixelRatio || 1
            canvas.width = Math.max(1, Math.floor(rect.width * dpr))
            canvas.height = Math.max(1, Math.floor(rect.height * dpr))
            const ctx = canvas.getContext('2d')
            if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        }
        update()
        window.addEventListener('resize', update)
        return () => window.removeEventListener('resize', update)
    }, [])

    usePaintCanvas(paintCanvasRef, data, highlightedCellIds)

    const { mutateAsync: createAnnotation } = useCreateAnnotation()
    const { mutateAsync: updateAnnotation } = useUpdateAnnotation()

    const flushPending = useCallback(async () => {
        if (!chartId || pendingAdditions.size === 0) return
        const existing = allAnnotations.find(a => a.type === 'heatmap')
        if (existing) {
            const current = new Set<string>(((existing.data as HeatmapAnnotation).cellIds) ?? [])
            pendingAdditions.forEach(id => current.add(id))
            setPendingAdditions(new Set())
            await updateAnnotation({ id: existing.id, chartId, data: { type: 'heatmap', cellIds: Array.from(current) } })
        } else {
            const newIds = Array.from(pendingAdditions)
            setPendingAdditions(new Set())
            await createAnnotation({ chartId, type: 'heatmap', data: { type: 'heatmap', cellIds: newIds } })
        }
        queryClient.invalidateQueries({ queryKey: ["annotations", chartId] })
    }, [chartId, pendingAdditions, allAnnotations, updateAnnotation, createAnnotation, queryClient])

    const debouncedFlush = useDebouncedCallback(() => { void flushPending() }, 5000)

    const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (isZoomSelecting) return
        dragStartRef.current = { x: e.clientX, y: e.clientY }
        const rect = paintCanvasRef.current?.getBoundingClientRect()
        if (!rect) return
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const cell = getCellFromPosition(paintCanvasRef, data, x, y)
        if (!cell) return
        const cellId = `${chartId}-${cell.row}-${cell.col}`
        if (!highlightedCellIds.has(cellId)) {
            setPendingAdditions(prev => new Set(prev).add(cellId))
        }

        const onMove = (ev: MouseEvent) => {
            const r = paintCanvasRef.current?.getBoundingClientRect()
            if (!r) return
            const mx = ev.clientX - r.left
            const my = ev.clientY - r.top
            const c = getCellFromPosition(paintCanvasRef, data, mx, my)
            if (!c) return
            const id = `${chartId}-${c.row}-${c.col}`
            if (!highlightedCellIds.has(id)) {
                setPendingAdditions(prev => {
                    const next = new Set(prev)
                    next.add(id)
                    return next
                })
            }
        }

        const onUp = (_ev: MouseEvent) => {
            debouncedFlush()

            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)
        }

        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)
    }, [isZoomSelecting, data, chartId, highlightedCellIds, debouncedFlush])


    useEffect(() => {
        return () => {
            debouncedFlush.flush()
        }
    }, [debouncedFlush])

    return (
        <div ref={containerRef} className="size-full relative" onMouseDown={onMouseDown}>
            <canvas ref={paintCanvasRef} className="absolute inset-0 size-full pointer-events-auto z-10" />
            <PaintContext.Provider value={{ paintCanvasRef }}>
                {children}
            </PaintContext.Provider>
        </div>
    )
}


