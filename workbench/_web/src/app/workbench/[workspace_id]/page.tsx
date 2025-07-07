import { getWorkspaceById } from "@/lib/api";
import { LogitLens } from "@/components/LogitLens";
import { redirect } from "next/navigation";
import { ActivationPatching } from "@/components/ActivationPatching";

export default async function Workbench({ params }: { params: { workspace_id: string } }) {
    try {
        const workspace = await getWorkspaceById(params.workspace_id);

        if (workspace.type === "logit_lens") {
            return <LogitLens />;
        } else if (workspace.type === "patching") {
            return <ActivationPatching />;
        } else {
            throw new Error("Invalid workspace type");
        }
    } catch (error) {
        // Redirect to workbench page if workspace doesn't exist
        redirect('/workbench');
    }
}