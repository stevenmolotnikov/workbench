import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuRadioGroup, 
    DropdownMenuRadioItem
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";
import { ChartArea } from "lucide-react";
import { useState } from "react";
import { useGridAnimation } from "@/components/charts/GridAnimationContext";

export default function ComponentDropdown() {
    const [patchTokens, setPatchTokens] = useState(false);
    const [position, setPosition] = useState("top");

    const { currentLayout, setCurrentLayout, triggerAnimation, isAnimating } = useGridAnimation()

    const handlePatchTokensChange = (checked: boolean) => {
        setPatchTokens(checked);
        setCurrentLayout(checked ? "grid" : "line");
    }

    return (
        <DropdownMenu onOpenChange={(open) => {
            if (open) {
                triggerAnimation();
            }
        }}>
            <DropdownMenuTrigger asChild>
                <Button className="h-8 w-8" size="icon">
                    <ChartArea />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
                <DropdownMenuCheckboxItem
                    checked={patchTokens}
                    onCheckedChange={handlePatchTokensChange}
                >
                    Patch Tokens
                </DropdownMenuCheckboxItem>
                <DropdownMenuLabel>Component Type</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={position} onValueChange={setPosition}>
                    <DropdownMenuRadioItem value="top">Top</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="bottom">Bottom</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="right">Right</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}