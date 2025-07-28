"use client";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getModels } from "@/lib/api/modelsApi";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

export function WorkbenchStatus() {
    const { data: models = [], isLoading, isError } = useQuery({
        queryKey: ['models'],
        queryFn: getModels,
        refetchInterval: 120000,
    });

    const getStatusInfo = () => {
        if (isLoading) return { text: 'Connecting', color: 'text-yellow-500 hover:text-yellow-600', pulse: true };
        if (isError) return { text: 'Error', color: 'text-destructive hover:text-destructive', pulse: false };
        return { text: 'Ready', color: 'text-green-600 hover:text-green-700', pulse: false };
    };

    const status = getStatusInfo();

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="secondary"
                    className={cn({
                        "animate-pulse": status.pulse
                    })}
                    size="sm"
                >
                    <div className={cn("text-white", status.color)}>
                        ●
                    </div>
                    {status.text}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                {isLoading ? 'Loading models...' : isError ? 'Failed to load models' : `${models.length} models available`}
            </PopoverContent>
        </Popover>
    );
}
