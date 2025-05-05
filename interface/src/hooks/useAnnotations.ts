import { useState } from 'react';
import { Annotation } from '@/types/session';

export function useAnnotations() {
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [activeAnnotation, setActiveAnnotation] = useState<{ x: number, y: number } | null>(null);
    const [annotationText, setAnnotationText] = useState("");

    const addAnnotation = () => {
        if (!activeAnnotation || !annotationText.trim()) return;

        const newAnnotation: Annotation = {
            id: Date.now().toString(),
            x: activeAnnotation.x,
            y: activeAnnotation.y,
            text: annotationText.trim(),
            timestamp: Date.now(),
        };

        setAnnotations(prev => [...prev, newAnnotation]);
        setActiveAnnotation(null);
        setAnnotationText("");
    };

    const cancelAnnotation = () => {
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
        setActiveAnnotation,
        annotationText,
        setAnnotationText,
        addAnnotation,
        cancelAnnotation,
        deleteAnnotation
    };
} 