"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GraduationCap, Lightbulb } from "lucide-react";
import { useWorkspace } from "@/stores/useWorkspace";

interface UserModeDialogProps {
    open: boolean;
}

export function UserModeDialog({ open }: UserModeDialogProps) {
    const { setUserMode } = useWorkspace();
    const [selectedMode, setSelectedMode] = useState<'learn' | 'experiment' | null>(null);

    const handleConfirm = () => {
        if (selectedMode) {
            setUserMode(selectedMode);
        }
    };

    return (
        <Dialog open={open} onOpenChange={() => {}}>
            <DialogContent className="sm:max-w-[525px]" onPointerDownOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Welcome! How would you like to use the workbench?</DialogTitle>
                    <DialogDescription>
                        Choose your preferred mode. You can change this later in settings.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                    <button
                        onClick={() => setSelectedMode('learn')}
                        className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                            selectedMode === 'learn' 
                                ? 'border-primary bg-primary/5' 
                                : 'border-border hover:border-primary/50'
                        }`}
                    >
                        <div className="mt-1">
                            <GraduationCap className="h-5 w-5 text-primary" />
                        </div>
                        <div className="text-left">
                            <h3 className="font-semibold mb-1">Learn Mode</h3>
                            <p className="text-sm text-muted-foreground">
                                Follow guided tutorials and structured learning paths to understand 
                                interpretability concepts step by step.
                            </p>
                        </div>
                    </button>

                    <button
                        onClick={() => setSelectedMode('experiment')}
                        className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                            selectedMode === 'experiment' 
                                ? 'border-primary bg-primary/5' 
                                : 'border-border hover:border-primary/50'
                        }`}
                    >
                        <div className="mt-1">
                            <Lightbulb className="h-5 w-5 text-primary" />
                        </div>
                        <div className="text-left">
                            <h3 className="font-semibold mb-1">Experiment Mode</h3>
                            <p className="text-sm text-muted-foreground">
                                Explore features freely and build your own projects. Perfect for 
                                experienced users who want to dive right in.
                            </p>
                        </div>
                    </button>
                </div>

                <DialogFooter>
                    <Button 
                        onClick={handleConfirm} 
                        disabled={!selectedMode}
                    >
                        Continue
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}