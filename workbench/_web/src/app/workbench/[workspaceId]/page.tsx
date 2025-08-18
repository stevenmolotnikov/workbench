"use client";

import { redirect } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { getMostRecentChartForWorkspace } from "@/lib/queries/chartQueries";

export default function Page() {
    const { workspaceId } = useParams();
    // TODO(cadentj): FIX THIS
    const { data: chart, isLoading } = useQuery({ queryKey: ["chart", workspaceId], queryFn: () => getMostRecentChartForWorkspace(workspaceId as string) });

    if (chart) {
        redirect(`/workbench/${workspaceId}/${chart.id}`);
    }

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return <div>No chart found</div>;
}