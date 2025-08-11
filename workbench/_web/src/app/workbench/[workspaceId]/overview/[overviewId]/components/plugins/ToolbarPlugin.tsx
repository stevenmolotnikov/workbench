"use client";

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { 
    $getSelection, 
    $isRangeSelection, 
    FORMAT_TEXT_COMMAND,
    FORMAT_ELEMENT_COMMAND,
    UNDO_COMMAND,
    REDO_COMMAND,
    CAN_UNDO_COMMAND,
    CAN_REDO_COMMAND
} from 'lexical';
import { 
    $createHeadingNode,
    $isHeadingNode,
    HeadingTagType,
    $createQuoteNode
} from '@lexical/rich-text';
import { $createParagraphNode } from 'lexical';
import {
    INSERT_UNORDERED_LIST_COMMAND,
    INSERT_ORDERED_LIST_COMMAND,
    REMOVE_LIST_COMMAND,
    $isListNode,
    ListNode
} from '@lexical/list';
import { $setBlocksType } from '@lexical/selection';
import { $getNearestNodeOfType } from '@lexical/utils';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
    Bold, 
    Italic, 
    Underline, 
    Code,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Undo,
    Redo,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Type
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const BLOCK_TYPE_TO_ICON = {
    paragraph: Type,
    h1: Heading1,
    h2: Heading2,
    h3: Heading3,
};

export function ToolbarPlugin() {
    const [editor] = useLexicalComposerContext();
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);
    const [isCode, setIsCode] = useState(false);
    const [blockType, setBlockType] = useState<string>('paragraph');

    const updateToolbar = useCallback(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
            setIsBold(selection.hasFormat('bold'));
            setIsItalic(selection.hasFormat('italic'));
            setIsUnderline(selection.hasFormat('underline'));
            setIsCode(selection.hasFormat('code'));

            const anchorNode = selection.anchor.getNode();
            const element =
                anchorNode.getKey() === 'root'
                    ? anchorNode
                    : anchorNode.getTopLevelElementOrThrow();
            const elementKey = element.getKey();
            const elementDOM = editor.getElementByKey(elementKey);
            if (elementDOM !== null) {
                if ($isListNode(element)) {
                    const parentList = $getNearestNodeOfType(anchorNode, ListNode);
                    const type = parentList ? parentList.getTag() : element.getTag();
                    setBlockType(type);
                } else {
                    const type = $isHeadingNode(element)
                        ? element.getTag()
                        : element.getType();
                    setBlockType(type);
                }
            }
        }
    }, [editor]);

    useEffect(() => {
        return editor.registerUpdateListener(({ editorState }) => {
            editorState.read(() => {
                updateToolbar();
            });
        });
    }, [editor, updateToolbar]);

    useEffect(() => {
        return editor.registerCommand(
            CAN_UNDO_COMMAND,
            (payload) => {
                setCanUndo(payload);
                return false;
            },
            1
        );
    }, [editor]);

    useEffect(() => {
        return editor.registerCommand(
            CAN_REDO_COMMAND,
            (payload) => {
                setCanRedo(payload);
                return false;
            },
            1
        );
    }, [editor]);

    const formatHeading = (headingType: HeadingTagType) => {
        if (blockType !== headingType) {
            editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    $setBlocksType(selection, () => $createHeadingNode(headingType));
                }
            });
        }
    };

    const formatParagraph = () => {
        if (blockType !== 'paragraph') {
            editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    $setBlocksType(selection, () => $createParagraphNode());
                }
            });
        }
    };

    const handleBlockTypeChange = (value: string) => {
        if (value === 'paragraph') {
            formatParagraph();
        } else if (value === 'h1' || value === 'h2' || value === 'h3') {
            formatHeading(value as HeadingTagType);
        } else if (value === 'ul') {
            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
        } else if (value === 'ol') {
            editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
        }
    };

    return (
        <div className="flex items-center gap-1 p-2 border-b">
            <Select value={blockType} onValueChange={handleBlockTypeChange}>
                <SelectTrigger className="w-[140px] h-8">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="paragraph">Normal</SelectItem>
                    <SelectItem value="h1">Heading 1</SelectItem>
                    <SelectItem value="h2">Heading 2</SelectItem>
                    <SelectItem value="h3">Heading 3</SelectItem>
                    <SelectItem value="ul">Bullet List</SelectItem>
                    <SelectItem value="ol">Numbered List</SelectItem>
                </SelectContent>
            </Select>

            <div className="w-px h-6 bg-border mx-1" />

            <Button
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 ${isBold ? 'bg-muted' : ''}`}
                onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
                aria-label="Format Bold"
            >
                <Bold className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 ${isItalic ? 'bg-muted' : ''}`}
                onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
                aria-label="Format Italic"
            >
                <Italic className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 ${isUnderline ? 'bg-muted' : ''}`}
                onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
                aria-label="Format Underline"
            >
                <Underline className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 ${isCode ? 'bg-muted' : ''}`}
                onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code')}
                aria-label="Format Code"
            >
                <Code className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')}
                aria-label="Left Align"
            >
                <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')}
                aria-label="Center Align"
            >
                <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')}
                aria-label="Right Align"
            >
                <AlignRight className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={!canUndo}
                onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
                aria-label="Undo"
            >
                <Undo className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={!canRedo}
                onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
                aria-label="Redo"
            >
                <Redo className="h-4 w-4" />
            </Button>
        </div>
    );
}