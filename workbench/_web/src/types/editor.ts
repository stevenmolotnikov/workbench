export interface EditorJSData {
    time: number;
    blocks: Array<{
        id: string;
        type: string;
        data: any;
    }>;
    version?: string;
}