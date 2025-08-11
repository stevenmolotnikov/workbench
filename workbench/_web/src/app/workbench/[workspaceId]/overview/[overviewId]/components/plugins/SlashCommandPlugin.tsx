"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  KEY_DOWN_COMMAND,
  TextNode,
  $insertNodes,
} from "lexical";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BasicChart, getChartsBasic } from "@/lib/queries/chartQueries";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { $createChartEmbedNode, INSERT_CHART_EMBED_COMMAND } from "../nodes/ChartEmbedNode";

export function SlashCommandPlugin() {
  const [editor] = useLexicalComposerContext();
  const params = useParams<{ workspaceId: string }>();
  const { data: charts } = useQuery({
    queryKey: ["basicCharts", params.workspaceId],
    queryFn: () => getChartsBasic(params.workspaceId),
    staleTime: 30_000,
  });

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return (charts ?? []).filter((c) => (c.name ?? c.id).toLowerCase().includes(q));
  }, [charts, query]);

  useEffect(() => {
    // Open dialog on '/'
    return editor.registerCommand(
      KEY_DOWN_COMMAND,
      (e: KeyboardEvent) => {
        if (e.key === "/") {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            // only open at start of an empty paragraph or right after whitespace
            const anchor = selection.anchor.getNode();
            if (anchor instanceof TextNode) {
              const textSoFar = anchor.getTextContent().slice(0, selection.anchor.offset);
              if (textSoFar.trim().length === 0) {
                setOpen(true);
                setQuery("");
                return true;
              }
            } else {
              setOpen(true);
              setQuery("");
              return true;
            }
          }
        }
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor]);

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

  const handleSelect = (chart: BasicChart) => {
    setOpen(false);
    editor.dispatchCommand(INSERT_CHART_EMBED_COMMAND, { chart });
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type to search charts…" value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>No charts found.</CommandEmpty>
        <CommandGroup heading="Charts">
          {filtered.map((c) => (
            <CommandItem key={c.id} value={c.name ?? c.id} onSelect={() => handleSelect(c)}>
              {(c.name ?? "Untitled")} — {c.type ?? "unknown"}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
