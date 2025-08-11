import { Textarea } from "@/components/ui/textarea";
import PatchControls from "./PatchControls";
import PatchProvider, { usePatch } from "./PatchProvider";
import { TokenArea } from "./TokenArea";
import { useWorkspace } from "@/stores/useWorkspace";
import ConnectionsProvider from "./ConnectionsProvider";

export default function SimplePatchArea() {

    return (
        <PatchProvider>
            <SimplePatchContent />
        </PatchProvider>
    )
}

const SimplePatchContent = () => {
    const { selectedModel } = useWorkspace();
    const { sourceText, destText, setSourceText, setDestText, isEditing, setIsEditing } = usePatch();

    if (!selectedModel) {
        return <div>No model selected</div>;
    }

    return (
        <div className="flex flex-col p-2 gap-2">
            <PatchControls isEditing={isEditing} setIsEditing={setIsEditing} />

            {
                isEditing ? (
                    <div className="flex flex-col gap-2">
                        <Textarea
                            value={sourceText}
                            onChange={(e) => setSourceText(e.target.value)}
                            className="h-48"
                            placeholder="Source" />
                        <Textarea
                            value={destText}
                            onChange={(e) => setDestText(e.target.value)}
                            className="h-48"
                            placeholder="Destination"
                        />
                    </div>
                ) : (
                    <ConnectionsProvider>
                        <div className="flex flex-col gap-2">
                            <div className="border rounded-md py-1 px-3 h-48">
                                <TokenArea side="source" />
                            </div>
                            <div className="border rounded-md py-1 px-3 h-48">
                                <TokenArea side="destination" />
                            </div>
                        </div>
                    </ConnectionsProvider>
                )}

        </div>
    )
}