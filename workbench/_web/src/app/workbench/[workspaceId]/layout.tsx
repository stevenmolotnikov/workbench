"use client";

import { ModeToggle } from "@/components/ui/mode-toggle";
import type React from "react";
import { UserDropdown } from "@/components/UserDropdown";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import Link from "next/link";

import { WorkbenchStatus } from "@/components/WorkbenchStatus";
import { CaptureProvider } from "@/components/providers/CaptureProvider";

export default function WorkbenchLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex flex-col h-screen bg-gradient-to-tr from-background to-primary/15">
            <header className="p-3 pl-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <img
                        src="/images/NDIF.png"
                        alt="NDIF Logo"
                        className="h-8"
                    />
                    <img
                        src="/images/NSF.png"
                        alt="NSF Logo"
                        className="h-8"
                    />
                </div>

                <nav className="flex gap-3 items-center">
                    <Link href="/workbench">
                        <Button variant="ghost" size="icon" title="Back to Workbench">
                            <Home className="h-4 w-4" />
                        </Button>
                    </Link>
                    <WorkbenchStatus />
                    <ModeToggle />
                    <UserDropdown />
                </nav>
            </header>
            <main className="flex-1 min-h-0 overflow-hidden">
                <CaptureProvider>
                    {children}
                </CaptureProvider>
            </main>
        </div>
    );
}
