import { usePathname, useParams } from "next/navigation";
import { FileText, ReplaceAll, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getConfigForChart } from "@/lib/queries/chartQueries";

const tools = [
    { name: "Lens", key: "lens", icon: <Search className="h-4 w-4" /> },
    { name: "Patch", key: "patch", icon: <ReplaceAll className="h-4 w-4" /> },
    { name: "Overview", key: "overview", icon: <FileText className="h-4 w-4" /> },
];

export function ToolTabs() {
    const pathname = usePathname();
    const { chartId } = useParams<{ chartId: string }>();

    const { data: config } = useQuery({
        queryKey: ["chartConfig", chartId],
        queryFn: () => getConfigForChart(chartId as string),
        enabled: !!chartId,
    });

    // Determine active tool: prefer config.type when available, else fallback to pathname
    const activeKey = (config?.type as string) || (pathname.includes("/lens") ? "lens" : pathname.includes("/patch") ? "patch" : pathname.includes("/overview") ? "overview" : undefined);
    const activeTool = tools.find(t => t.key === activeKey);

    return (
        <div className="flex items-center justify-between border-b h-12 px-2 py-2">
            <div className="relative group">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded transition-colors bg-muted text-foreground">
                    {activeTool?.icon}
                    {activeTool?.name || ""}
                </div>
            </div>
        </div>
    )
}