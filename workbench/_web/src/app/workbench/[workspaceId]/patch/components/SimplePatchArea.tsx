import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import PatchControls from "./PatchControls";

export default function SimplePatchArea() {
    const [source, setSource] = useState("");
    const [destination, setDestination] = useState("");

    const [isEditing, setIsEditing] = useState(true);

    return (
        <div className="flex flex-col p-2 gap-2">
            <PatchControls isEditing={isEditing} setIsEditing={setIsEditing} />

            {
                isEditing ? (
                    <div className="flex flex-col gap-2">
                        <Textarea
                            value={source}
                            onChange={(e) => setSource(e.target.value)}
                            className="h-48"
                            placeholder="Source" />
                        <Textarea
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            className="h-48"
                            placeholder="Destination"
                        />
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        <p>{source}</p>
                        <p>{destination}</p>
                    </div>
                )}

        </div>
    )
}