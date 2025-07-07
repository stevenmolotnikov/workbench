"use client";

import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createWorkspace } from "@/lib/api";
import { useRouter } from "next/navigation";

const workspaceTypes = [
    { value: "logit_lens", label: "Logit Lens" },
    { value: "patching", label: "Activation Patching" },
] as const;

export function CreateWorkspaceDialog() {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [type, setType] = useState<typeof workspaceTypes[number]["value"]>("logit_lens");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !type) return;

        setIsLoading(true);
        try {
            const newWorkspace = await createWorkspace(name.trim(), type, false);
            setOpen(false);
            setName("");
            setType("logit_lens");
            router.push(`/workbench/${newWorkspace.id}`);
        } catch (error) {
            console.error("Failed to create workspace:", error);
            // You might want to show a toast notification here
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            setName("");
            setType("logit_lens");
        }
        setOpen(newOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Create Workspace
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New Workspace</DialogTitle>
                    <DialogDescription>
                        Create a new workspace to start exploring your model's behavior.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Workspace Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter workspace name..."
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="type">Workspace Type</Label>
                            <Select value={type} onValueChange={(value) => setType(value as typeof type)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select workspace type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {workspaceTypes.map((workspaceType) => (
                                        <SelectItem key={workspaceType.value} value={workspaceType.value}>
                                            {workspaceType.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!name.trim() || isLoading}>
                            {isLoading ? "Creating..." : "Create Workspace"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
} 