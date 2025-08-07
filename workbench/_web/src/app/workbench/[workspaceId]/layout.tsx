"use client";

import { ModeToggle } from "@/components/ui/mode-toggle";
import type React from "react";
import { UserDropdown } from "@/components/UserDropdown";

import { WorkbenchStatus } from "@/components/WorkbenchStatus";
import { useWorkspace } from "@/stores/useWorkspace";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FileText, SquarePen } from "lucide-react";

export default function WorkbenchLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {

    const { annotationsOpen, setAnnotationsOpen } = useWorkspace();

    const router = useRouter();
    const { workspaceId } = useParams();
    const handleOverview = () => {
        router.push(`/workbench/${workspaceId}/overview`);
    };


    return (
        <div className="flex flex-col h-screen">
            <header className="border-b px-4 py-3 flex items-center justify-between h-[6vh]">
                <div className="flex items-center gap-4">
                    <img
                        src="/images/NSF.png"
                        alt="NSF Logo"
                        className="h-8"
                    />
                    <img
                        src="/images/NDIF.png"
                        alt="NDIF Logo"
                        className="h-8"
                    />
                </div>

                <nav className="flex gap-2 items-center">
                    <WorkbenchStatus />
                    <ModeToggle />
                    <UserDropdown />

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleOverview}>
                            <FileText size={16} />
                            Overview
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setAnnotationsOpen(!annotationsOpen)}>
                            <SquarePen size={16} />
                            Annotate
                        </Button>
                        {/* <TutorialsToggle tutorialsOpen={tutorialsOpen} toggleTutorials={toggleTutorials} /> */}
                    </div>
                </nav>
            </header>
            {children}
        </div>
    );
}
