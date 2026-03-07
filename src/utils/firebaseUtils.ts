/**
 * Recursively removes all undefined properties from an object or array.
 * This is essential for Firestore payloads which throw errors on undefined values.
 */
export function deepStripUndefined<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => deepStripUndefined(item)) as unknown as T;
    }

    const newObj: Record<string, any> = {};
    Object.keys(obj as Record<string, any>).forEach(key => {
        const val = (obj as Record<string, any>)[key];
        if (val !== undefined) {
            newObj[key] = deepStripUndefined(val);
        }
    });

    return newObj as T;
}
