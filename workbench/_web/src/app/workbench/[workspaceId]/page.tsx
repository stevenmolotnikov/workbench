"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getChartsForSidebar } from "@/lib/queries/chartQueries";
import { useCreateLensChartPair } from "@/lib/api/chartApi";

export default function WorkspaceIndexRedirect() {
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const router = useRouter();
    const createLensPair = useCreateLensChartPair();

    const { data: charts } = useQuery({
        queryKey: ["chartsForSidebar", workspaceId],
        queryFn: () => getChartsForSidebar(workspaceId),
        enabled: !!workspaceId,
    });

    useEffect(() => {
        if (!workspaceId) return;
        const go = async () => {
            if (charts && charts.length > 0) {
                router.replace(`/workbench/${workspaceId}/${charts[0].id}`);
            } else {
                try {
                    const { chart } = await createLensPair.mutateAsync({
                        workspaceId,
                        defaultConfig: {
                            prompt: "",
                            model: "",
                            token: { idx: 0, id: 0, text: "", targetIds: [] },
                        },
                    });
                    router.replace(`/workbench/${workspaceId}/${chart.id}`);
                } catch (e) {
                    console.error("Failed to create default chart", e);
                }
            }
        };
        go();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workspaceId, charts]);

    return null;
}