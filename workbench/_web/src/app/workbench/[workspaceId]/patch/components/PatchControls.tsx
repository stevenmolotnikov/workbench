import { encodeText } from "@/actions/tokenize";
import { Button } from "@/components/ui/button";
import { GitCompareArrows, Pencil, Route } from "lucide-react";
import { useState } from "react";
import { usePatch } from "./PatchProvider";
import { useWorkspace } from "@/stores/useWorkspace";

interface PatchControlsProps {
    isEditing: boolean;
    setIsEditing: (isEditing: boolean) => void;
}

export default function PatchControls({ isEditing, setIsEditing }: PatchControlsProps) {
    const { selectedModel } = useWorkspace();
    const { sourceText, destText, setSourceTokenData, setDestTokenData } = usePatch();

    if (!selectedModel) {
        return <div>No model selected</div>;
    }

    const handleTokenize = async () => {
        const sourceTokens = await encodeText(sourceText, selectedModel.name);
        const destTokens = await encodeText(destText, selectedModel.name);
        setSourceTokenData(sourceTokens);
        setDestTokenData(destTokens);
        setIsEditing(false);
    }

    return (
        <div className="flex items-center gap-2">
            <Button
                variant="outline"
                size="icon"
                // onClick={() => setIsAligning(!isAligning)}
            >
                <GitCompareArrows />
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={() => {
                    if (isEditing) {
                        handleTokenize();
                    } else {
                        setIsEditing(!isEditing);
                    }
                }}  
            >
                {isEditing ? "Tokenize" : "Edit"}
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