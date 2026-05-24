// Pagination utilities for calculating pixel-perfect page splits and inserting spacers

export const A4_HEIGHT_PX = 1123;
export const A4_WIDTH_PX = 794;
export const PAGE_SAFE_PADDING_PX = 36;
export const PAGINATION_SPACER_CLASS = 'cv-pagination-spacer';

export type PaginationSpacerTarget = 'field' | 'section';

export interface PaginationSpacerPlacement {
    fieldId: string;
    height: number;
    target: PaginationSpacerTarget;
}

export const escapeSelectorValue = (value: string) => {
    if (typeof CSS !== 'undefined' && CSS.escape) return CSS.escape(value);
    return value.replace(/["\\]/g, '\\$&');
};

export const getRelativeTop = (root: HTMLElement, element: HTMLElement) => {
    const rootRect = root.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    return elementRect.top - rootRect.top;
};

export const getFieldElements = (root: HTMLElement, collectionName: string, index: number) => {
    return Array.from(root.querySelectorAll<HTMLElement>('[data-field-id]')).filter((element) => {
        const fieldId = element.dataset.fieldId || '';
        return fieldId.startsWith(`${collectionName}[${index}].`);
    });
};

export const findFieldGroupBlock = (root: HTMLElement, elements: HTMLElement[], collectionName: string, index: number) => {
    if (elements.length === 0) return null;

    const hasGroupShape = (fieldIds: string[]) => {
        if (collectionName === 'employmentHistory') {
            return fieldIds.some((fieldId) => fieldId.endsWith('.jobTitle')) &&
                fieldIds.some((fieldId) => fieldId.endsWith('.description'));
        }

        if (collectionName === 'education') {
            return fieldIds.some((fieldId) => fieldId.endsWith('.degree')) &&
                fieldIds.some((fieldId) => fieldId.endsWith('.school') || fieldId.endsWith('.description'));
        }

        return fieldIds.length >= 2;
    };

    let candidate: HTMLElement | null = elements[0].parentElement;
    while (candidate && candidate !== root) {
        const nestedFields = Array.from(candidate.querySelectorAll<HTMLElement>('[data-field-id]'))
            .map((element) => element.dataset.fieldId || '');

        const currentGroupFields = nestedFields.filter((fieldId) => fieldId.startsWith(`${collectionName}[${index}].`));
        const otherGroupFields = nestedFields.filter((fieldId) => {
            const match = fieldId.match(new RegExp(`^${collectionName}\\[(\\d+)\\]\\.`));
            return match && Number(match[1]) !== index;
        });

        if (hasGroupShape(currentGroupFields) && otherGroupFields.length === 0) {
            return candidate;
        }

        candidate = candidate.parentElement;
    }

    return elements[0];
};

export const collectPageBreakBlocks = (root: HTMLElement) => {
    const blocks = new Set<HTMLElement>();

    root.querySelectorAll<HTMLElement>('section').forEach((section) => {
        const containsEmploymentRows = section.querySelector('[data-field-id^="employmentHistory["]');
        if (!containsEmploymentRows && section.querySelector('[data-field-id]')) {
            blocks.add(section);
        }
    });

    const summary = root.querySelector<HTMLElement>(`[data-field-id="${escapeSelectorValue('professionalSummary')}"]`);
    if (summary) blocks.add(summary);

    ['employmentHistory', 'education'].forEach((collectionName) => {
        const indexes = new Set<number>();
        root.querySelectorAll<HTMLElement>('[data-field-id]').forEach((element) => {
            const fieldId = element.dataset.fieldId || '';
            const match = fieldId.match(new RegExp(`^${collectionName}\\[(\\d+)\\]\\.`));
            if (match) indexes.add(Number(match[1]));
        });

        indexes.forEach((index) => {
            const groupBlock = findFieldGroupBlock(root, getFieldElements(root, collectionName, index), collectionName, index);
            if (groupBlock) blocks.add(groupBlock);
        });
    });

    return Array.from(blocks)
        .filter((block) => !block.classList.contains(PAGINATION_SPACER_CLASS))
        .sort((a, b) => getRelativeTop(root, a) - getRelativeTop(root, b));
};

export const applyPaginationSpacing = (root: HTMLElement) => {
    root.querySelectorAll(`.${PAGINATION_SPACER_CLASS}`).forEach((spacer) => spacer.remove());

    const blocks = collectPageBreakBlocks(root);

    for (let pass = 0; pass < 60; pass += 1) {
        const blockToMove = blocks.find((block) => {
            const rect = block.getBoundingClientRect();
            const blockHeight = rect.height;
            if (blockHeight <= 0 || blockHeight >= A4_HEIGHT_PX - (PAGE_SAFE_PADDING_PX * 2)) return false;

            const top = getRelativeTop(root, block);
            const pageOffset = ((top % A4_HEIGHT_PX) + A4_HEIGHT_PX) % A4_HEIGHT_PX;
            const remainingPageSpace = A4_HEIGHT_PX - pageOffset;
            const crossesPageBoundary = pageOffset > PAGE_SAFE_PADDING_PX && blockHeight + PAGE_SAFE_PADDING_PX > remainingPageSpace;

            return crossesPageBoundary;
        });

        if (!blockToMove?.parentElement) break;

        const top = getRelativeTop(root, blockToMove);
        const pageOffset = ((top % A4_HEIGHT_PX) + A4_HEIGHT_PX) % A4_HEIGHT_PX;
        const spacerHeight = Math.max(0, A4_HEIGHT_PX - pageOffset + PAGE_SAFE_PADDING_PX);

        const spacer = document.createElement('div');
        spacer.className = PAGINATION_SPACER_CLASS;
        spacer.setAttribute('aria-hidden', 'true');
        spacer.style.height = `${spacerHeight}px`;
        spacer.style.pointerEvents = 'none';
        spacer.style.breakAfter = 'avoid';
        spacer.style.breakInside = 'avoid';
        blockToMove.parentElement.insertBefore(spacer, blockToMove);
    }
};

export const getFirstFieldId = (element: Element | null) => {
    if (!element) return null;
    if (element instanceof HTMLElement && element.dataset.fieldId) return element.dataset.fieldId;
    return element.querySelector<HTMLElement>('[data-field-id]')?.dataset.fieldId || null;
};

export const collectSpacerPlacements = (root: HTMLElement): PaginationSpacerPlacement[] => {
    return Array.from(root.querySelectorAll<HTMLElement>(`.${PAGINATION_SPACER_CLASS}`))
        .map((spacer) => {
            const targetElement = spacer.nextElementSibling;
            const fieldId = getFirstFieldId(targetElement);
            if (!fieldId) return null;

            return {
                fieldId,
                height: spacer.getBoundingClientRect().height,
                target: targetElement instanceof HTMLElement && targetElement.tagName.toLowerCase() === 'section'
                    ? 'section'
                    : 'field'
            };
        })
        .filter((placement): placement is PaginationSpacerPlacement => Boolean(placement));
};

export const findPlacementTarget = (root: HTMLElement, fieldId: string, target: PaginationSpacerTarget = 'field') => {
    const exact = root.querySelector<HTMLElement>(`[data-field-id="${escapeSelectorValue(fieldId)}"]`);

    if (target === 'section') {
        return exact?.closest('section') as HTMLElement | null || exact;
    }

    const collectionMatch = fieldId.match(/^(employmentHistory|education)\[(\d+)\]\./);
    if (collectionMatch) {
        const [, collectionName, index] = collectionMatch;
        return findFieldGroupBlock(root, getFieldElements(root, collectionName, Number(index)), collectionName, Number(index));
    }

    return exact?.closest('section') as HTMLElement | null || exact;
};

export const applySpacerPlacements = (root: HTMLElement, placements: PaginationSpacerPlacement[]) => {
    root.querySelectorAll(`.${PAGINATION_SPACER_CLASS}`).forEach((spacer) => spacer.remove());

    placements.forEach((placement) => {
        const target = findPlacementTarget(root, placement.fieldId, placement.target);
        if (!target?.parentElement) return;

        const spacer = document.createElement('div');
        spacer.className = PAGINATION_SPACER_CLASS;
        spacer.setAttribute('aria-hidden', 'true');
        spacer.style.height = `${placement.height}px`;
        spacer.style.pointerEvents = 'none';
        spacer.style.breakAfter = 'avoid';
        spacer.style.breakInside = 'avoid';
        target.parentElement.insertBefore(spacer, target);
    });
};
