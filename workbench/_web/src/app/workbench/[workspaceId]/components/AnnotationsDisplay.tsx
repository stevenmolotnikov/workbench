import { useAnnotations } from "@/stores/useAnnotations";

export function AnnotationsDisplay() {
    const { pendingAnnotation } = useAnnotations();

    return (
        <div className="flex">
            <h1>Annotations</h1>
            {JSON.stringify(pendingAnnotation, null, 2)}
        </div>
    );
}