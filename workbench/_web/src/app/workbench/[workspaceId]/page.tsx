import { redirect } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getWorkspaceById } from "@/lib/queries/workspaceQueries";
import { useParams } from "next/navigation";

// export default function Page() {
//     const { workspaceId } = useParams();
//     const { data: workspace } = useQuery({ queryKey: ["workspace", workspaceId], queryFn: () => getWorkspaceById(workspaceId as string) });

//     if (process.env.NEXT_PUBLIC_LOCAL === "true") {
//         redirect("/workbench");
//     } else {
//         redirect("/login");
//     }
// }