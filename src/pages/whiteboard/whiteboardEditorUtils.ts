import { exportToSvg } from '@excalidraw/excalidraw';
import { ExcalidrawFileData } from '../../types';

export const SAVE_DELAY_MS = 2000;
const PREFS_STORAGE_KEY = 'excalidraw-user-prefs';

const PERSISTED_PREF_KEYS = [
    'currentItemStrokeColor',
    'currentItemBackgroundColor',
    'currentItemFillStyle',
    'currentItemStrokeWidth',
    'currentItemStrokeStyle',
    'currentItemRoughness',
    'currentItemOpacity',
    'currentItemFontFamily',
    'currentItemFontSize',
    'currentItemTextAlign',
    'currentItemRoundness',
    'currentItemStartArrowhead',
    'currentItemEndArrowhead',
] as const;

export const serializeElements = (elements: readonly any[]): any[] => {
    try {
        return JSON.parse(JSON.stringify(elements.filter((el: any) => !el.isDeleted)));
    } catch {
        return [];
    }
};

export const buildExcalidrawPayload = (
    elements: readonly any[],
    appState: Record<string, any>
): ExcalidrawFileData => ({
    type: 'excalidraw',
    version: 2,
    source: window.location.origin,
    elements: serializeElements(elements),
    appState: {
        gridSize: appState.gridSize ?? 20,
        gridStep: appState.gridStep ?? 5,
        gridModeEnabled: appState.gridModeEnabled ?? false,
        viewBackgroundColor: appState.viewBackgroundColor ?? '#ffffff',
    },
    files: {},
});

export const toFirestoreJson = (payload: ExcalidrawFileData): string => {
    return JSON.stringify(payload);
};

export const fromFirestoreJson = (json: string | undefined): ExcalidrawFileData | null => {
    if (!json) return null;
    try {
        return JSON.parse(json) as ExcalidrawFileData;
    } catch {
        return null;
    }
};

export const generateThumbnailSvg = async (elements: readonly any[], appState: any): Promise<string> => {
    try {
        const filtered = elements.filter((el: any) => !el.isDeleted);
        if (filtered.length === 0) return '';
        const svg = await exportToSvg({
            elements: filtered as any,
            appState: { ...appState, exportWithDarkMode: false, exportBackground: true },
        });
        const str = new XMLSerializer()
            .serializeToString(svg)
            .replace(/<!--[\s\S]*?-->/g, '')
            .replace(/\s{2,}/g, ' ')
            .trim();
        return str.length > 500_000 ? '' : str;
    } catch {
        return '';
    }
};

export const loadUserPrefs = (): Record<string, any> => {
    try {
        const raw = localStorage.getItem(PREFS_STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
};

export const saveUserPrefs = (appState: Record<string, any>) => {
    try {
        const prefs: Record<string, any> = {};
        for (const key of PERSISTED_PREF_KEYS) {
            if (appState[key] !== undefined) prefs[key] = appState[key];
        }
        localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
    } catch { /* noop */ }
};

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const isPrimaryDiagramNode = (element: any) => {
    return ['rectangle', 'ellipse', 'diamond', 'triangle'].includes(element?.type);
};

const elementCenter = (element: any) => ({
    x: Number(element?.x || 0) + Number(element?.width || 0) / 2,
    y: Number(element?.y || 0) + Number(element?.height || 0) / 2,
});

const buildGenerationStages = (elements: any[]): any[][] => {
    const safeElements = elements.filter((element: any) => element && !element.isDeleted);
    const primaryNodes = safeElements
        .filter(isPrimaryDiagramNode)
        .sort((a: any, b: any) => (a.y - b.y) || (a.x - b.x));
    const textElements = safeElements.filter((element: any) => element.type === 'text');
    const connectorElements = safeElements
        .filter((element: any) => ['arrow', 'line'].includes(element.type))
        .sort((a: any, b: any) => (a.y - b.y) || (a.x - b.x));
    const assignedTextIds = new Set<string>();
    const stages: any[][] = [];

    primaryNodes.forEach((node: any) => {
        const center = elementCenter(node);
        const nearbyText = textElements.filter((text: any) => {
            if (assignedTextIds.has(text.id)) return false;
            const textCenter = elementCenter(text);
            return Math.abs(textCenter.x - center.x) <= Math.max(140, Number(node.width || 0))
                && Math.abs(textCenter.y - center.y) <= Math.max(90, Number(node.height || 0));
        });

        nearbyText.forEach((text: any) => assignedTextIds.add(text.id));
        stages.push([node, ...nearbyText]);
    });

    const remainingNonConnectors = safeElements.filter((element: any) => {
        if (isPrimaryDiagramNode(element)) return false;
        if (['arrow', 'line'].includes(element.type)) return false;
        if (element.type === 'text' && assignedTextIds.has(element.id)) return false;
        return true;
    });

    for (let index = 0; index < remainingNonConnectors.length; index += 2) {
        stages.push(remainingNonConnectors.slice(index, index + 2));
    }

    for (let index = 0; index < connectorElements.length; index += 3) {
        stages.push(connectorElements.slice(index, index + 3));
    }

    if (stages.length === 0 && safeElements.length > 0) {
        for (let index = 0; index < safeElements.length; index += 3) {
            stages.push(safeElements.slice(index, index + 3));
        }
    }

    return stages.filter(stage => stage.length > 0);
};

const getConnectorEndpointIds = (element: any) => {
    const ids = [
        element?.startBinding?.elementId,
        element?.endBinding?.elementId,
        element?.start?.id,
        element?.end?.id,
    ].filter(Boolean);
    return ids as string[];
};

export const buildComponentRevealStages = (elements: any[]): any[][] => {
    const safeElements = elements.filter((element: any) => element && !element.isDeleted);
    const primaryNodes = safeElements
        .filter(isPrimaryDiagramNode)
        .sort((a: any, b: any) => (a.y - b.y) || (a.x - b.x));

    if (primaryNodes.length === 0) {
        return buildGenerationStages(safeElements);
    }

    const textElements = safeElements.filter((element: any) => element.type === 'text');
    const connectorElements = safeElements.filter((element: any) => ['arrow', 'line'].includes(element.type));
    const assignedTextIds = new Set<string>();
    const revealedNodeIds = new Set<string>();
    const revealedConnectorIds = new Set<string>();
    const stages: any[][] = [];

    primaryNodes.forEach((node: any) => {
        const center = elementCenter(node);
        const nearbyText = textElements.filter((text: any) => {
            if (assignedTextIds.has(text.id)) return false;
            const textCenter = elementCenter(text);
            return Math.abs(textCenter.x - center.x) <= Math.max(140, Number(node.width || 0))
                && Math.abs(textCenter.y - center.y) <= Math.max(90, Number(node.height || 0));
        });

        nearbyText.forEach((text: any) => assignedTextIds.add(text.id));
        revealedNodeIds.add(node.id);

        const readyConnectors = connectorElements.filter((connector: any) => {
            if (revealedConnectorIds.has(connector.id)) return false;
            const endpointIds = getConnectorEndpointIds(connector);
            return endpointIds.length >= 2 && endpointIds.every(endpointId => revealedNodeIds.has(endpointId));
        });

        readyConnectors.forEach((connector: any) => revealedConnectorIds.add(connector.id));
        stages.push([node, ...nearbyText, ...readyConnectors]);
    });

    const remainingElements = safeElements.filter((element: any) => {
        if (primaryNodes.some((node: any) => node.id === element.id)) return false;
        if (element.type === 'text' && assignedTextIds.has(element.id)) return false;
        if (['arrow', 'line'].includes(element.type) && revealedConnectorIds.has(element.id)) return false;
        return true;
    });

    remainingElements
        .sort((a: any, b: any) => (a.y - b.y) || (a.x - b.x))
        .forEach((element: any) => stages.push([element]));

    return stages.filter(stage => stage.length > 0);
};
