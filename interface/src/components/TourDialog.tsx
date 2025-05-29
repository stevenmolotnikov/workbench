import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useTour } from "@reactour/tour";
import { useState } from "react";
import { LogitLensTutorial } from "@/types/tutorial";
import { BookOpen, ChevronRight, ArrowLeft } from "lucide-react";

interface TourDescriptionProps {
    onBack: () => void;
    onStartChapter: (chapterIndex: number) => void;
}

function TourDescription({ onBack, onStartChapter }: TourDescriptionProps) {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onBack}
                    className="h-8 w-8 p-0"
                >
                    <ArrowLeft size={16} />
                </Button>
                <h3 className="font-semibold">{LogitLensTutorial.chapters[0] ? "Logit Lens" : "Tutorial"}</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
                {LogitLensTutorial.description}
            </p>
            <div className="flex flex-col gap-2">
                {LogitLensTutorial.chapters.map((chapter, index) => (
                    <div
                        key={index}
                        className="flex flex-row justify-between items-center p-3"
                    >
                        <div>
                            <span className="font-medium text-sm">{chapter.title}</span>
                            <p className="text-xs text-muted-foreground">
                                {chapter.steps.length} steps
                            </p>
                        </div>
                        <Button
                            size="sm"
                            onClick={() => onStartChapter(index)}
                            variant="outline"
                            className="h-8"
                        >
                            Start
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function TourDialog() {
    const { setSteps, setIsOpen, setMeta } = useTour();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [showTourDescription, setShowTourDescription] = useState(false);

    const handleStartChapter = (chapterIndex: number) => {
        const chapter = LogitLensTutorial.chapters[chapterIndex];
        if (chapter && setSteps) {
            setSteps(chapter.steps);
            setIsOpen(true);
            setDialogOpen(false);
            setMeta(chapter.title);
        }
    };

    const handleTourClick = () => {
        setShowTourDescription(true);
    };

    const handleBack = () => {
        setShowTourDescription(false);
    };

    return (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="h-8 text-xs">
                    <BookOpen size={16} />
                    Tutorials
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] overflow-hidden">
                {!showTourDescription && <DialogHeader>
                    <DialogTitle>Tutorials</DialogTitle>
                    <DialogDescription>Learn about the interface.</DialogDescription>
                </DialogHeader>}
                <div className="transition-opacity duration-200">
                    {!showTourDescription ? (
                        <div className="flex flex-col gap-3">
                            <div
                                className="flex flex-row justify-between items-center border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors duration-200"
                                onClick={handleTourClick}
                            >
                                <div>
                                    <span className="font-medium">Logit Lens</span>
                                    <p className="text-xs text-muted-foreground">
                                        Walk through an example of Logit Lens.
                                    </p>
                                </div>
                                <ChevronRight size={16} />
                            </div>
                        </div>
                    ) : (
                        <TourDescription
                            onBack={handleBack}
                            onStartChapter={handleStartChapter}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
