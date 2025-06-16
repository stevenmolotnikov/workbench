import { Button } from "./button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

interface TooltipButtonProps {
    children: React.ReactNode;
    tooltip: string;
    onClick?: () => void;
    variant?: "default" | "outline" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
    className?: string;
    id?: string;
    disabled?: boolean;
}

export function TooltipButton({
    children,
    tooltip,
    onClick,
    variant = "default",
    size = "default",
    className,
    id,
    disabled,
}: TooltipButtonProps) {
    return (
        <TooltipProvider delayDuration={100}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className="inline-block">
                        <Button 
                            onClick={onClick} 
                            variant={variant} 
                            size={size} 
                            className={className}
                            id={id}
                            disabled={disabled}
                        >
                            {children}
                        </Button>
                    </span>
                </TooltipTrigger>
                <TooltipContent className="bg-background border text-foreground">{tooltip}</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
