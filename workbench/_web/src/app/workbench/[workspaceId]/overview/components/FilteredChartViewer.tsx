// "use client";

// import { useState, useMemo } from "react";
// import { useQuery } from "@tanstack/react-query";
// import { getAllAnnotationsForWorkspace } from "@/lib/queries/annotationQueries";
// import { getOrCreateLensCharts } from "@/lib/queries/chartQueries";
// import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Heatmap } from "@/components/charts/heatmap/Heatmap";
// import { Line } from "@/components/charts/line/Line";
// import { HeatmapData, LineGraphData } from "@/types/charts";

// interface FilteredChartViewerProps {
//     selectedAnnotations: Set<string>;
//     workspaceId: string;
// }

// export function FilteredChartViewer({ 
//     selectedAnnotations,
//     workspaceId 
// }: FilteredChartViewerProps) {
//     const [activeTab, setActiveTab] = useState<string | null>(null);

//     const { data: annotationsData = [] } = useQuery({
//         queryKey: ["workspace-annotations", workspaceId],
//         queryFn: () => getAllAnnotationsForWorkspace(workspaceId),
//     });

//     const { data: { lensCharts = [], unlinkedCharts = [] } = {} } = useQuery({
//         queryKey: ["lensCharts", workspaceId],
//         queryFn: () => getOrCreateLensCharts(workspaceId, {
//             workspaceId: workspaceId,
//         }),
//     });

//     const allCharts = useMemo(() => {
//         return [...lensCharts, ...unlinkedCharts];
//     }, [lensCharts, unlinkedCharts]);

//     const filteredCharts = useMemo(() => {
//         if (selectedAnnotations.size === 0) {
//             const chartsWithAnnotations = new Set(annotationsData.map(a => a.chartId));
//             return allCharts.filter(c => chartsWithAnnotations.has(c.id));
//         }
        
//         const selectedChartIds = new Set(
//             annotationsData
//                 .filter(a => selectedAnnotations.has(a.id))
//                 .map(a => a.chartId)
//         );
        
//         return allCharts.filter(c => selectedChartIds.has(c.id));
//     }, [allCharts, selectedAnnotations, annotationsData]);

//     const activeChart = useMemo(() => {
//         return filteredCharts.find(c => c.id === activeTab) || filteredCharts[0];
//     }, [filteredCharts, activeTab]);

//     if (filteredCharts.length === 0) {
//         return (
//             <div className="flex-1 flex items-center justify-center text-muted-foreground">
//                 <div className="text-center">
//                     <p className="text-sm">No charts to display</p>
//                     <p className="text-xs mt-1">Select annotations to view related charts</p>
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div className="flex flex-col h-full">
//             <Tabs 
//                 value={activeChart?.id || ""} 
//                 onValueChange={setActiveTab} 
//                 className="flex-1 flex flex-col"
//             >
//                 <div className="px-2 pt-1 flex items-center gap-1 bg-background">
//                     <TabsList className="h-8 bg-transparent">
//                         {filteredCharts.map((chart) => (
//                             <div key={chart.id} className="inline-flex items-center group relative">
//                                 <TabsTrigger
//                                     value={chart.id}
//                                     className="data-[state=active]:bg-muted rounded-b-none h-8 pr-2 relative !shadow-none"
//                                 >
//                                     <span className="px-2">
//                                         {chart.type === "heatmap" ? "Heatmap" : chart.type === "line" ? "Line" : "Untitled"} Chart
//                                     </span>
//                                 </TabsTrigger>
//                             </div>
//                         ))}
//                     </TabsList>
//                 </div>

//                 <div className="flex flex-col h-full p-4">
//                     <div className="flex h-full w-full border rounded">
//                         {activeChart?.data && activeChart.type === "heatmap" ? (
//                             <Heatmap data={activeChart.data as HeatmapData} />
//                         ) : activeChart?.data && activeChart.type === "line" ? (
//                             <Line data={activeChart.data as LineGraphData} />
//                         ) : (
//                             <div className="flex items-center justify-center h-full text-muted-foreground">
//                                 No chart data available
//                             </div>
//                         )}
//                     </div>
//                 </div>
//             </Tabs>
//         </div>
//     );
// }