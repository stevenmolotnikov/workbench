import { cn } from "@/lib/utils";

interface TargetTokenBadgeProps {
    label: string;
    value?: string;
    isActive: boolean;
    onClick: () => void;
    className?: string;
}

export function TargetTokenBadge({ 
    label, 
    value, 
    isActive, 
    onClick, 
    className 
}: TargetTokenBadgeProps) {
    const isEmpty = !value;
    
    const fixString = (str: string) => {
        return str.replace(" ", "_");
    };

    return (
        <div
            className={cn(
                "inline-flex items-center px-2 py-1 rounded-md text-xs cursor-pointer transition-colors",
                isEmpty 
                    ? "border-2 border-dashed border-muted-foreground/30 bg-muted/20 text-muted-foreground hover:border-muted-foreground/50"
                    : "border border-muted bg-muted text-muted-foreground hover:bg-muted/80",
                isActive && "border-primary border-2",
                className
            )}
            onClick={onClick}
            title={isEmpty ? `Click to select ${label.toLowerCase()} token` : `${label}: ${value}`}
        >
            {isEmpty ? (
                <span className="text-muted-foreground/60">
                    {label}
                </span>
            ) : (
                <>
                    <span className="font-medium text-xs opacity-60 mr-1">
                        {label}:
                    </span>
                    <span className="font-medium">
                        {fixString(value)}
                    </span>
                </>
            )}
        </div>
    );
} 