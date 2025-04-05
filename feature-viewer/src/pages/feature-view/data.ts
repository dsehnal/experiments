export type EntityId = string;
export type Properties = Record<string, string | number>;

export type Sequence = {
    title?: string;
    description?: string;
    data: string;
    properties?: Properties;
};

export interface AlignedSequence {
    type: 'aligned-sequence';
    id: EntityId;
    sequence: Sequence;
    offset: number[];
}

export interface FeatureElement<T = any> {
    start: number;
    end?: number;
    value: T;
}

interface _Feature<K extends string, T> {
    type: 'feature';
    id: EntityId;
    kind: K;
    elements: FeatureElement<T>[];
    title?: string;
    properties?: Properties;
}

export type Feature =
    | _Feature<'root', void>
    | _Feature<'empty', void>
    | _Feature<'secondary-structure', 'helix' | 'sheet' | 'loop'>
    | _Feature<'mutation-count', number>;

export const RootId = '<:root:>';
export const RootFeature: Feature = {
    type: 'feature',
    id: RootId,
    kind: 'root',
    elements: [],
};

export interface FeatureView {
    node: Feature | AlignedSequence;
    children?: FeatureView[];
}

export interface FeatureViewState {
    expandedIds: EntityId[];
    propertyFilters: Record<string, { kind: 'substr'; value: string } | { kind: 'range'; min?: number; max?: number }>;
    currentEntityId?: EntityId;
}

export const EmptyFeatureView: FeatureView = { node: RootFeature };
export const DefaultFeatureViewState: FeatureViewState = {
    expandedIds: [],
    propertyFilters: {},
};

export const FeatureUtils = {
    getWidth: (view: FeatureView) => {
        let w = view.node.type === 'aligned-sequence' ? view.node.sequence.data.length : 0;
        if (view.children) {
            for (const child of view.children) {
                w = Math.max(FeatureUtils.getWidth(child));
            }
        }
        return w;
    },
    getPropertyNames: (view: FeatureView) => {
        const names = getPropertyNames(view, new Set());
        return Array.from(names);
    },
    elementOverlaps: (fe: FeatureElement, start: number, end: number) => {
        const s = fe.start;
        const e = fe.end ?? s;
        if (start <= s) return end >= s;
        return end <= e;
    },
    findEntity: (view: FeatureView, id: EntityId): FeatureView | undefined => {
        if (view.node.id === id) return view;
        if (!view.children) return undefined;
        for (const c of view.children) {
            const e = FeatureUtils.findEntity(c, id);
            if (e) return e;
        }
        return undefined;
    },
};

function getPropertyNames(view: FeatureView, names: Set<string>) {
    if (view.node.type === 'aligned-sequence') {
        for (const p of Object.keys(view.node.sequence.properties ?? {})) names.add(p);
    } else if (view.node.type === 'feature') {
        for (const p of Object.keys(view.node.properties ?? {})) names.add(p);
    }
    if (view.children) {
        for (const c of view.children) getPropertyNames(c, names);
    }
    return names;
}
