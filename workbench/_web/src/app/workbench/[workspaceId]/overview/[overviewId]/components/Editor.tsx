"use client";

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import EditorJS from '@editorjs/editorjs';
import { Button } from '@/components/ui/button';
import { useGetDocument, useSaveDocument } from '@/lib/api/documentApi';
import { EditorJSData } from '@/types/editor';

export function Editor() {
    const editorRef = useRef<EditorJS | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    
    const { workspaceId, overviewId } = useParams<{ workspaceId: string; overviewId: string }>();
    const { data: document, isLoading } = useGetDocument(overviewId);
    const { mutate: saveDocument } = useSaveDocument();

    useEffect(() => {
        if (!containerRef.current || editorRef.current || isLoading) return;

        const initEditor = async () => {
            const editor = new EditorJS({
                holder: containerRef.current!,
                placeholder: 'Start writing your content here...',
                autofocus: true,
                data: document?.content as EditorJSData || {
                    blocks: []
                },
                onChange: async () => {
                    setHasChanges(true);
                }
            });

            editorRef.current = editor;
        };

        initEditor();

        return () => {
            if (editorRef.current && editorRef.current.destroy) {
                editorRef.current.destroy();
                editorRef.current = null;
            }
        };
    }, [document, isLoading]);

    const handleSave = async () => {
        if (!editorRef.current) return;
        
        setIsSaving(true);
        try {
            const content = await editorRef.current.save();
            saveDocument(
                { workspaceId, content },
                {
                    onSuccess: () => {
                        setHasChanges(false);
                        setIsSaving(false);
                    },
                    onError: () => {
                        setIsSaving(false);
                    }
                }
            );
        } catch (error) {
            console.error('Failed to save:', error);
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-full w-full flex items-center justify-center p-4">
                <div className="text-muted-foreground">Loading document...</div>
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
                <h2 className="text-lg font-semibold">Document Editor</h2>
                <Button 
                    onClick={handleSave}
                    disabled={isSaving || !hasChanges}
                    size="sm"
                >
                    {isSaving ? 'Saving...' : hasChanges ? 'Save' : 'Saved'}
                </Button>
            </div>
            <div className="flex-1 overflow-auto p-4">
                <div ref={containerRef} className="prose prose-sm max-w-none min-h-full" />
            </div>
        </div>
    );
}