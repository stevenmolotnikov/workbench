"use client";

import {
    Settings2,
} from "lucide-react";

import { Button } from "../ui/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export function PatchingSettings({
    tokenizeOnEnter,
    setTokenizeOnEnter,
    component,
    setComponent,
    patchTokens,
    setPatchTokens,
}: {
    tokenizeOnEnter: boolean;
    setTokenizeOnEnter: (value: boolean) => void;
    component: string;
    setComponent: (value: string) => void;
    patchTokens: boolean;
    setPatchTokens: (value: boolean) => void;
}) {
    const handleComponentChange = (value: string) => {
        if (value === "head" && patchTokens) {
            // If selecting head while patch tokens is enabled, disable patch tokens
            setPatchTokens(false);
        }
        setComponent(value);
    };

    const handlePatchTokensChange = (value: boolean) => {
        if (value && component === "head") {
            // If enabling patch tokens while component is head, change component to blocks
            setComponent("blocks");
        }
        setPatchTokens(value);
    };
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button size="icon">
                    <Settings2 size={16} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64">
                <DropdownMenuLabel>Completion Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                    checked={tokenizeOnEnter}
                    onCheckedChange={setTokenizeOnEnter}
                >
                    Tokenize on Enter
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                    checked={patchTokens}
                    onCheckedChange={handlePatchTokensChange}
                >
                    Patch Tokens
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <div className="px-2 py-2">
                    <div className="text-sm font-medium mb-2">Component</div>
                    <Select value={component} onValueChange={handleComponentChange}>
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="blocks">blocks</SelectItem>
                            <SelectItem value="heads">heads</SelectItem>
                            <SelectItem value="attn">attn</SelectItem>
                            <SelectItem value="mlp">mlp</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}