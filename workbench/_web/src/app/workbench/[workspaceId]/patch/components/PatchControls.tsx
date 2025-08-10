import { Button } from "@/components/ui/button";
import { GitCompareArrows, Pencil, Route } from "lucide-react";
import { useState } from "react";

interface PatchControlsProps {
    isEditing: boolean;
    setIsEditing: (isEditing: boolean) => void;
}

export default function PatchControls({ isEditing, setIsEditing }: PatchControlsProps) {

    const [isAligning, setIsAligning] = useState(false);

    return (
        <div className="flex items-center gap-2">
            <Button
                variant="outline"
                size="icon"
                onClick={() => setIsAligning(!isAligning)}
            >
                <GitCompareArrows />
            </Button>
            <Button
                variant="outline"
                size="icon"
                onClick={() => setIsEditing(!isEditing)}
            >
                <Pencil />
            </Button>
            {/* <Button
                variant="outline"
                size="icon"
            >
                <Route />
            </Button> */}
        </div>
    )
}