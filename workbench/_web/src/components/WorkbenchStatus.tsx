"use client";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { ModelLoadStatus } from '@/types/workbench';
import { useModels } from '@/hooks/useModels';

const getStatusMessage = (modelLoadStatus: ModelLoadStatus) => {
    if (modelLoadStatus === 'loading') {
        return (
            <div>
                The backend is hosted as a deployment on <a href="https://modal.com" className="text-blue-500">Modal</a>.
                We're starting up a container for your session.
            </div>
        );
    } else if (modelLoadStatus === 'success') {
        return (
            <div>
                Some things might be slow, but they'll warm up soon enough!
            </div>
        );
    } else if (modelLoadStatus === 'error') {
        return (
            <div>
                Could not connect to the backend. Reach out to Caden, he probably turned it off.
            </div>
        );
    }
}

export function WorkbenchStatus() {
    const { isLoading, error } = useModels();
    const modelLoadStatus: ModelLoadStatus = isLoading ? 'loading' : error ? 'error' : 'success';

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="secondary"
                    className={cn({
                        "animate-pulse": modelLoadStatus === 'loading'
                    })}
                    size="sm"
                >
                    <div
                        className={cn("text-white", {
                            "text-yellow-500 hover:text-yellow-600 animate-pulse": modelLoadStatus === 'loading',
                            "text-green-600 hover:text-green-700": modelLoadStatus === 'success',
                            "text-destructive hover:text-destructive": modelLoadStatus === 'error',
                        })}
                    >
                        ●
                    </div>
                    {modelLoadStatus === 'loading' ? 'Connecting' : modelLoadStatus === 'success' ? 'Ready' : 'Error'}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                {getStatusMessage(modelLoadStatus)}
            </PopoverContent>
        </Popover>
    );
}
