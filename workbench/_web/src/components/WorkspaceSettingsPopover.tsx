"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Settings2, Globe, Lock } from "lucide-react";
import { toast } from "sonner";

interface WorkspaceSettingsPopoverProps {
  workspaceId: string;
}

export function WorkspaceSettingsPopover({ workspaceId }: WorkspaceSettingsPopoverProps) {
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    async function fetchWorkspaceSettings() {
      try {
        const response = await fetch(`/api/workspaces/${workspaceId}`);
        if (response.ok) {
          const data = await response.json();
          setIsPublic(data.workspace.public || false);
          
          // Check if current user is the owner
          const userResponse = await fetch('/api/auth/me');
          if (userResponse.ok) {
            const userData = await userResponse.json();
            setIsOwner(data.workspace.userId === userData.user?.id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch workspace settings:", error);
      }
    }
    
    fetchWorkspaceSettings();
  }, [workspaceId]);

  const handleTogglePublic = async () => {
    if (!isOwner) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ public: !isPublic }),
      });

      if (response.ok) {
        setIsPublic(!isPublic);
        toast.success(
          !isPublic
            ? "Workspace is now public. Anyone with the link can view it."
            : "Workspace is now private. Only you can access it."
        );
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to update workspace settings");
      }
    } catch (error) {
      console.error("Failed to update workspace:", error);
      toast.error("Failed to update workspace settings");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOwner) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Workspace Settings</h4>
            <p className="text-sm text-muted-foreground">
              Configure your workspace visibility and permissions.
            </p>
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isPublic ? (
                  <Globe className="h-4 w-4 text-blue-500" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
                <Label htmlFor="public-toggle" className="cursor-pointer">
                  {isPublic ? "Public workspace" : "Private workspace"}
                </Label>
              </div>
              <Switch
                id="public-toggle"
                checked={isPublic}
                onCheckedChange={handleTogglePublic}
                disabled={isLoading}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {isPublic
                ? "Anyone with the link can view this workspace."
                : "Only you can access this workspace."}
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
} 