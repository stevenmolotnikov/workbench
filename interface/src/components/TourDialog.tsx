import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useTour } from "@reactour/tour";
import { useState } from "react";
import { TourSteps } from "@/components/providers/TourProvider";

export function TourDialog() {
    const { setSteps, setIsOpen } = useTour();

    const [dialogOpen, setDialogOpen] = useState(false);

    const handleStartTour = (tourType: string) => {
        setSteps(TourSteps[tourType]);
        setIsOpen(true);
        setDialogOpen(false);
    };

    return (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="h-8 text-xs">
                    Tutorials
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Tutorials</DialogTitle>
                    <DialogDescription>Learn about the interface.</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-row justify-between items-center">
                        <div>
                            <span>Features</span>
                            <p className="text-xs text-muted-foreground">Understand the general layout.</p>
                        </div>
                        <Button variant="outline" className="h-8" onClick={() => handleStartTour("feature")}>
                            Start Tour
                        </Button>
                    </div>
                    <div className="flex flex-row justify-between items-center">
                        <div>
                            <span>Logit Lens</span>
                            <p className="text-xs text-muted-foreground">Walk through an example of Logit Lens.</p>
                        </div>
                        <Button variant="outline" className="h-8" onClick={() => handleStartTour("logitLens")}>
                            Start Tour
                        </Button>
                    </div>
                    <div className="flex flex-row justify-between items-center">
                        <div>
                            <span>Activation Patching</span>
                            <p className="text-xs text-muted-foreground">Learn about activation patching.</p>
                        </div>
                        <Button variant="outline" className="h-8" onClick={() => handleStartTour("")}>
                            Start Tour
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
