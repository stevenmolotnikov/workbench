"use client";

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { $getRoot, EditorState } from 'lexical';

interface OnChangePluginProps {
    onChange: (editorState: EditorState) => void;
}

export function OnChangePlugin({ onChange }: OnChangePluginProps) {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        return editor.registerUpdateListener(({ editorState }) => {
            onChange(editorState);
        });
    }, [editor, onChange]);

    return null;
}