import { useState } from 'react';
import { Annotation } from '@/types/workspace';

export function useAnnotations() {
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [activeAnnotation, setActiveAnnotation] = useState<{ x: number, y: number } | null>(null);
    const [annotationText, setAnnotationText] = useState("");

    const handleSetActiveAnnotation = (coords: { x: number, y: number } | null) => {
        if (coords) {
            // Remove the last annotation if it has no text
            setAnnotations(prev => {
                const updated = [...prev];
                if (updated.length > 0 && !updated[updated.length - 1].text) {
                    updated.pop();
                }
                return updated;
            });

            const newAnnotation: Annotation = {
                id: Date.now().toString(),
                x: coords.x,
                y: coords.y,
                text: "",
                timestamp: Date.now(),
            };
            setAnnotations(prev => [...prev, newAnnotation]);
        }
        setActiveAnnotation(coords);
    };

    const addAnnotation = () => {
        if (!annotationText.trim()) return;

        setAnnotations(prev => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            if (lastIndex >= 0) {
                updated[lastIndex] = {
                    ...updated[lastIndex],
                    text: annotationText.trim()
                };
            }
            return updated;
        });
        setActiveAnnotation(null);
        setAnnotationText("");
    };

    const cancelAnnotation = () => {
        setAnnotations(prev => prev.slice(0, -1));
        setActiveAnnotation(null);
        setAnnotationText("");
    };

    const deleteAnnotation = (id: string) => {
        setAnnotations(prev => prev.filter(a => a.id !== id));
    };

    return {
        annotations,
        setAnnotations,
        activeAnnotation,
        setActiveAnnotation: handleSetActiveAnnotation,
        annotationText,
        setAnnotationText,
        addAnnotation,
        cancelAnnotation,
        deleteAnnotation
    };
}