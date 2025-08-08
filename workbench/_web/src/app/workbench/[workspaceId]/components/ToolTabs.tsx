import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { FileText, ReplaceAll, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const tools = [
    {
        name: "Lens",
        path: "/lens",
        icon: <Search className="h-4 w-4" />
    },
    {
        name: "Patch",
        path: "/patch",
        icon: <ReplaceAll className="h-4 w-4" />
    },
]
export function ToolTabs() {
    const pathname = usePathname();
    const router = useRouter();

    const handleToolClick = (path: string) => {
        // Get everything except the last segment
        const basePath = pathname.substring(0, pathname.lastIndexOf('/'));
        router.push(basePath + path);
    }

    const activeTool = tools.find(tool =>
        pathname.endsWith(tool.path)
    );

    return (
        <div className="flex items-center justify-between border-b h-12 px-2 py-2">
            <div className="flex items-center gap-1">
                {tools.map((tool) => (
                    // Individual tab
                    <div key={tool.name} className="relative group">
                        <button
                            onClick={() => handleToolClick(tool.path)}
                            className={cn(
                                "inline-flex items-center gap-2 px-3 py-1 rounded-md transition-colors",
                                "group-hover:bg-muted/50",
                                activeTool?.path === tool.path ? "bg-muted text-foreground" : "text-muted-foreground"
                            )}
                        >
                            {tool.icon}
                            {tool.name}
                        </button>
                    </div>
                ))}
            </div>
            <div className="flex items-center gap-1">
                <button onClick={() => handleToolClick("/overview")} className="flex border rounded items-center gap-2 px-3 py-1 text-foreground transition-colors">
                    <FileText className="h-4 w-4" />
                    Overview
                </button>
            </div>
        </div>
    )
}