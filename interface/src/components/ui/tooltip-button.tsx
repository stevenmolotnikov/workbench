import { Button } from "./button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

interface TooltipButtonProps {
    children: React.ReactNode;
    tooltip: string;
    onClick?: () => void;
    variant?: "default" | "outline" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
    className?: string;
}

export function TooltipButton({
    children,
    tooltip,
    onClick,
    variant = "default",
    size = "default",
    className,
}: TooltipButtonProps) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button onClick={onClick} variant={variant} size={size} className={className}>
                        {children}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>{tooltip}</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
