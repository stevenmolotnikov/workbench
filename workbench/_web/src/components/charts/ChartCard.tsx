import { BorderBeam } from "@/components/magicui/border-beam";

interface ChartCardProps {
    isLoading: boolean;
    chartId: string;
    chart: React.ReactNode;
}

export function ChartCard({
    isLoading,
    chartId,
    chart,
}: ChartCardProps) {
    return (
        <div className="h-full flex flex-col border rounded-lg p-4 bg-card">
            {isLoading ? (
                <>
                    <div className="flex items-center justify-center h-full">
                        <div className="text-muted-foreground">Loading...</div>
                    </div>
                    <BorderBeam
                        duration={5}
                        size={300}
                        className="from-transparent bg-primary to-transparent"
                    />
                </>
            ) : (
                chart
            )}
        </div>
    );
}
