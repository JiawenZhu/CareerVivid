// Official Excalidraw JSON file format (v2)
export interface ExcalidrawFileData {
    type: 'excalidraw';
    version: 2;
    source: string;
    elements: any[];          // Array of drawing elements from Excalidraw
    appState: {
        gridSize: number;
        gridStep: number;
        gridModeEnabled: boolean;
        viewBackgroundColor: string;
    };
    files: Record<string, any>; // Image/file embeds (future-proof)
}

export type ExcalidrawElement = any;
export type AppState = any;

/** Top-level Firestore document for a whiteboard. */
export interface WhiteboardData {
    id: string;
    userId: string;
    title: string;
    /** The nested, official .excalidraw JSON payload */
    excalidrawData: ExcalidrawFileData;
    /** Pre-rendered SVG string for fast dashboard card previews */
    thumbnailSvg?: string;
    /** Whether this whiteboard is publicly viewable */
    isPublic?: boolean;
    createdAt: number;
    updatedAt: number;
    section?: string;
}

