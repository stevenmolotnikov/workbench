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

export function TourDialog() {
    const { isOpen, setIsOpen, currentStep, steps, setCurrentStep } = useTour();

    const [dialogOpen, setDialogOpen] = useState(false);

    const handleStartTour = () => {
        setIsOpen(true);
        setDialogOpen(false);
    };

    return (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="h-8 text-xs">Tutorials</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit profile</DialogTitle>
                    <DialogDescription>
                        Make changes to your profile here. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span>Name</span>
                        <Button variant="outline" onClick={handleStartTour}>Start Tour</Button>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span>Username</span>
                        <Input id="username" value="@peduarte" className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit">Save changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
