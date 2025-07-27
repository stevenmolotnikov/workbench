import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { SquarePen, FileText } from "lucide-react";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { StatusUpdatesDisplay } from "./StatusUpdatesDisplay";
import { useAnnotations } from "@/stores/useAnnotations";
// import { TutorialsToggle } from "./TutorialsToggle";
import { WorkspaceSettingsPopover } from "./WorkspaceSettingsPopover";

interface WorkbenchModeProps {
    tutorialsOpen: boolean;
    workbenchMode: "lens" | "patch";
    setWorkbenchMode: (mode: "lens" | "patch") => void;
    toggleTutorials: () => void;
    workspaceId?: string;
}

export function WorkbenchMenu({ 
    tutorialsOpen, 
    workbenchMode,
    setWorkbenchMode,
    toggleTutorials, 
    workspaceId
}: WorkbenchModeProps) {
    const router = useRouter();

    const handleValueChange = (value: "lens" | "patch") => {
        setWorkbenchMode(value);
    };

    const toggleAnnotations = () => {
        const { isOpen } = useAnnotations.getState();
        useAnnotations.setState({ isOpen: !isOpen });
    };

    const handleExport = () => {
        router.push('/workbench/summaries');
    };

    return (
        <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Select value={workbenchMode} onValueChange={handleValueChange}>
                    <SelectTrigger className="w-24 h-8">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="lens">Lens</SelectItem>
                        <SelectItem value="patch">Patch</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="flex items-center gap-2">
                <StatusUpdatesDisplay />
                {workspaceId && <WorkspaceSettingsPopover workspaceId={workspaceId} />}
                <Button variant="outline" size="sm" onClick={handleExport}>
                    <FileText size={16} />
                    Export
                </Button>
                <Button variant="outline" size="sm" onClick={toggleAnnotations}>
                    <SquarePen size={16} />
                    Annotate
                </Button>
                {/* <TutorialsToggle tutorialsOpen={tutorialsOpen} toggleTutorials={toggleTutorials} /> */}
            </div>
        </div>
    );
}
