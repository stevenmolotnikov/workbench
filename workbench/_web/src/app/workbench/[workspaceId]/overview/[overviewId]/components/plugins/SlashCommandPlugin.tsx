"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect, useMemo, useState, useRef } from "react";
import {
  $createParagraphNode,
  $insertNodes,
  COMMAND_PRIORITY_LOW,
  $getSelection,
  $isRangeSelection,
} from "lexical";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getChartsBasicWithToolType } from "@/lib/queries/chartQueries";
import type { BasicChartWithTool } from "@/types/charts";
import { $createChartEmbedNode, INSERT_CHART_EMBED_COMMAND } from "../nodes/ChartEmbedNode";
import { LexicalTypeaheadMenuPlugin } from "@lexical/react/LexicalTypeaheadMenuPlugin";
import { MenuOption, useBasicTypeaheadTriggerMatch } from "@lexical/react/LexicalTypeaheadMenuPlugin";
import * as ReactDOM from "react-dom";

export function SlashCommandPlugin() {
  const [editor] = useLexicalComposerContext();
  const params = useParams<{ workspaceId: string }>();
  const { data: charts } = useQuery({
    queryKey: ["basicChartsWithTool", params.workspaceId],
    queryFn: () => getChartsBasicWithToolType(params.workspaceId),
    staleTime: 30_000,
  });

  const [queryString, setQueryString] = useState<string | null>(null);
  const menuRectRef = useRef<{ top: number; left: number; height: number } | null>(null);
  const prevQueryStringRef = useRef<string | null>(null);
  const menuContainerRef = useRef<HTMLDivElement | null>(null);

  const resetMenuPosition = () => {
    menuRectRef.current = null;
  };

  const options = useMemo(() => {
    if (queryString === null) return [] as ChartOption[];
    const q = queryString.toLowerCase();
    return ((charts ?? []) as BasicChartWithTool[])
      .filter((c) => (c.name ?? c.id).toLowerCase().includes(q))
      .slice(0, 10)
      .map((c) => new ChartOption(c));
  }, [charts, queryString]);

  // Clear/freeze lifecycle: reset cache only when menu opens or closes, not on every keystroke
  useEffect(() => {
    const prev = prevQueryStringRef.current;
    // Menu just opened
    if (prev === null && queryString !== null) {
      resetMenuPosition();
    }
    // Menu just closed
    if (prev !== null && queryString === null) {
      resetMenuPosition();
    }
    prevQueryStringRef.current = queryString;
  }, [queryString]);

  // Clear cache when user explicitly closes via Escape or clicks outside
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && menuContainerRef.current) {
        resetMenuPosition();
      }
    }
    function handleMouseDown(e: MouseEvent) {
      const container = menuContainerRef.current;
      if (!container) return;
      if (e.target instanceof Node && container.contains(e.target)) {
        return;
      }
      // Clicked outside of the menu
      resetMenuPosition();
    }
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleMouseDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  useEffect(() => {
    // Handle insert command by inserting our custom node
    return editor.registerCommand(
      INSERT_CHART_EMBED_COMMAND,
      (payload) => {
        editor.update(() => {
          const node = $createChartEmbedNode({ chartId: payload.chart.id, chartType: payload.chart.type });
          $insertNodes([node]);
          // Insert an empty paragraph after so the user can continue typing
          const paragraph = $createParagraphNode();
          node.insertAfter(paragraph);
          paragraph.select();
        });
        return true;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor]);

  const triggerFn = useBasicTypeaheadTriggerMatch("/", { minLength: 0, maxLength: 50 });

  return (
    <LexicalTypeaheadMenuPlugin
      onQueryChange={setQueryString}
      triggerFn={triggerFn}
      options={options}
      onSelectOption={(option, _nodeToReplace, closeMenu) => {
        if (!(option instanceof ChartOption)) return;
        closeMenu();
        // Clear cached position when menu closes
        resetMenuPosition();
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const toDelete = (queryString ?? "").length + 1; // include '/'
            for (let i = 0; i < toDelete; i++) {
              selection.deleteCharacter(true);
            }
            const node = $createChartEmbedNode({ chartId: option.chart.id, chartType: option.chart.chartType });
            $insertNodes([node]);
            const paragraph = $createParagraphNode();
            node.insertAfter(paragraph);
            paragraph.select();
          }
        });
      }}
      menuRenderFn={(anchorElementRef, { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }) => {
        // If menu is not open or there are no options, clear cache and don't render
        if (!anchorElementRef.current || options.length === 0) {
          resetMenuPosition();
          return null;
        }
        
        // Get fresh position from anchor
        const rect = anchorElementRef.current.getBoundingClientRect();

        // If we have a cached rect but the caret jumped significantly, treat as a new session and reset cache
        const cached = menuRectRef.current;
        if (
          cached &&
          (Math.abs(rect.top - cached.top) > Math.max(12, cached.height) || Math.abs(rect.left - cached.left) > 24)
        ) {
          resetMenuPosition();
        }
        
        // Only cache valid positions (not 0,0)
        if (!menuRectRef.current && rect.top > 0 && rect.left >= 0) {
          menuRectRef.current = { top: rect.top, left: rect.left, height: rect.height };
        }
        
        // Use cached position if available and valid, otherwise use current
        const stableRect = (menuRectRef.current && menuRectRef.current.top > 0) ? menuRectRef.current : rect;
        
        // If still invalid position, don't render
        if (stableRect.top === 0 && stableRect.left === 0) {
          return null;
        }
        
        const menuTop = stableRect.top + stableRect.height + 4;
        const menuLeft = stableRect.left;
        return ReactDOM.createPortal(
          <div
            className="z-50 bg-popover text-popover-foreground border rounded-md shadow-md p-1 max-h-60 overflow-auto min-w-[260px]"
            style={{ position: "fixed", top: menuTop, left: menuLeft }}
            ref={menuContainerRef}
            onMouseDown={(e) => e.preventDefault()}
          >
            {options.map((opt, i) => {
              const active = i === selectedIndex;
              return (
                <div
                  key={opt.key}
                  role="option"
                  aria-selected={active}
                  className={`px-2 py-1.5 text-sm cursor-pointer flex items-center justify-between rounded ${active ? "bg-accent text-accent-foreground" : ""}`}
                  onMouseEnter={() => setHighlightedIndex(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectOptionAndCleanUp(opt)}
                >
                  <span className="truncate mr-2">{opt.chart.name ?? "Untitled"}</span>
                  <span className="text-xs text-muted-foreground">
                    {(opt.chart.chartType ?? "unknown")} {opt.chart.toolType ? `· ${opt.chart.toolType}` : ""}
                  </span>
                </div>
              );
            })}
            {options.length === 0 && (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">No charts found.</div>
            )}
          </div>,
          document.body
        );
      }}
    />
  );
}

class ChartOption extends MenuOption {
  chart: BasicChartWithTool;
  constructor(chart: BasicChartWithTool) {
    super(chart.id);
    this.chart = chart;
  }
}
