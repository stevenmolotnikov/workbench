"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getChartsForSidebar } from "@/lib/queries/chartQueries";

export default function LegacyPatchRedirect() {
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const router = useRouter();

    const { data: charts } = useQuery({
        queryKey: ["chartsForSidebar", workspaceId],
        queryFn: () => getChartsForSidebar(workspaceId),
        enabled: !!workspaceId,
    });

    useEffect(() => {
        if (charts && charts.length > 0) {
            const patchChart = charts.find(c => c.toolType === "patch") || charts[0];
            router.replace(`/workbench/${workspaceId}/${patchChart.id}`);
        }
    }, [charts, router, workspaceId]);

    return null;
}
