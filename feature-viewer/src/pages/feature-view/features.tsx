import {
    AlignedSequence,
    DefaultFeatureViewState,
    EmptyFeatureView,
    EntityId,
    Feature,
    FeatureElement,
    FeatureUtils,
    FeatureView,
    FeatureViewState,
} from '@/pages/feature-view/data';
import { useBehavior } from '@/lib/hooks/use-behavior';
import { ReactiveModel } from '@/lib/reactive-model';
import { memoizeLatest } from '@/lib/util/memoize';
import { Button, Table } from '@chakra-ui/react';
import { BehaviorSubject } from 'rxjs';
import { useEffect, useRef } from 'react';
import { LuMinus, LuPlus } from 'react-icons/lu';
import { useReactiveModel } from '@/lib/hooks/use-reactive-model';

export interface FeatureViewInfo {
    width: number;
    propertyNames: string[];
}

export class FeatureViewModel extends ReactiveModel {
    state = {
        view: new BehaviorSubject<FeatureView>(EmptyFeatureView),
        state: new BehaviorSubject<FeatureViewState>(DefaultFeatureViewState),
        highlight: new BehaviorSubject<
            | {
                  start: number;
                  end?: number;
                  view: FeatureView['node'];
                  element?: FeatureElement;
              }
            | undefined
        >(undefined),
    };

    get view() {
        return this.state.view.value;
    }

    get viewState() {
        return this.state.state.value;
    }

    private _info = memoizeLatest((view: FeatureView) => {
        const width = FeatureUtils.getWidth(view);
        const propertyNames = FeatureUtils.getPropertyNames(view);
        return { width, propertyNames } satisfies FeatureViewInfo;
    });

    get info() {
        return this._info(this.view);
    }

    toggleExpanded(id: EntityId) {
        if (this.viewState.expandedIds.includes(id)) {
            this.state.state.next({
                ...this.viewState,
                expandedIds: this.viewState.expandedIds.filter((i) => i !== id),
            });
        } else {
            this.state.state.next({
                ...this.viewState,
                expandedIds: [...this.viewState.expandedIds, id],
            });
        }
    }

    toggleCurrent(id?: EntityId) {
        if (!id || this.viewState.currentEntityId === id) {
            this.state.state.next({ ...this.viewState, currentEntityId: undefined });
        } else {
            this.state.state.next({ ...this.viewState, currentEntityId: id });
        }
    }

    mount() {
        this.subscribe(this.state.view, () => {
            this.state.highlight.next(undefined);
            this.state.state.next(DefaultFeatureViewState);
        });
    }
}

export function FeatureViewUI({ model }: { model: FeatureViewModel }) {
    useReactiveModel(model);
    const view = useBehavior(model.state.view);
    useBehavior(model.state.state);

    const { info } = model;

    return (
        <Table.Root size='sm' stickyHeader showColumnBorder interactive>
            <Table.Header>
                <Table.Row bg='bg.subtle'>
                    <Table.ColumnHeader>Title</Table.ColumnHeader>
                    <Table.ColumnHeader>Sequence/Feature</Table.ColumnHeader>
                    {info.propertyNames.map((p) => (
                        <Table.Cell key={p}>{p}</Table.Cell>
                    ))}
                </Table.Row>
            </Table.Header>
            <Table.Body>
                <Node model={model} view={view} offset={0} />
            </Table.Body>
        </Table.Root>
    );
}

function Node({ model, view, offset }: { model: FeatureViewModel; view: FeatureView; offset: number }) {
    const isRoot = view.node.type === 'feature' && view.node.kind === 'root';
    const nextOffset = isRoot ? offset : offset + 1;
    const hasChildren = (view.children?.length ?? 0) > 0;

    return (
        <>
            {view.node.type === 'aligned-sequence' && (
                <SequenceTrack model={model} view={view.node} offset={offset} hasChildren={hasChildren} />
            )}
            {view.node.type === 'feature' && !isRoot && (
                <FeatureTrack model={model} view={view.node} offset={offset} hasChildren={hasChildren} />
            )}
            {(isRoot || model.viewState.expandedIds.includes(view.node.id)) &&
                view.children?.map((v) => <Node key={v.node.id} model={model} view={v} offset={nextOffset} />)}
        </>
    );
}

const BaseWidth = 10;

function SequenceTrack({
    model,
    view,
    offset,
    hasChildren,
}: {
    model: FeatureViewModel;
    view: AlignedSequence;
    offset: number;
    hasChildren?: boolean;
}) {
    const sequenceRef = useRef<HTMLTableCellElement>(null);
    const { info, viewState } = model;

    useEffect(() => {
        const sub = model.state.highlight.subscribe((h) => {
            const start = h ? h.start : Number.MAX_VALUE;
            const end = h ? (h.end ?? h.start) : -Number.MAX_VALUE;

            const seq = view.sequence.data;
            const children = sequenceRef.current!.children;

            // can be optimized by storing the previous highlight
            for (let i = 0; i < seq.length; i++) {
                if (i >= start && i <= end) {
                    (children[i] as HTMLElement).style.backgroundColor = 'orange';
                } else {
                    (children[i] as HTMLElement).style.backgroundColor = 'transparent';
                }
            }
        });
        return () => sub.unsubscribe();
    }, [view]);

    return (
        <Table.Row
            bg={viewState.currentEntityId === view.id ? '#222' : undefined}
            onClick={() => model.toggleCurrent(view.id)}
        >
            <Table.Cell paddingLeft={2 * offset}>
                {hasChildren && <ToggleChildren model={model} id={view.id} />}
                <ToggleCurrent model={model} id={view.id} title={view.sequence.title ?? 'Sequence'} />
            </Table.Cell>
            <Table.Cell
                style={{ fontFamily: 'monospace', cursor: 'pointer' }}
                ref={sequenceRef}
                onMouseMove={(e) => {
                    const offset = (e.target as HTMLElement).getAttribute('data-offset');
                    if (!offset) model.state.highlight.next(undefined);
                    else model.state.highlight.next({ start: +offset, view });
                }}
                onMouseLeave={() => model.state.highlight.next(undefined)}
            >
                {Array.from(view.sequence.data).map((e, i) => (
                    <span key={i} data-offset={i} style={{ width: BaseWidth, display: 'inline-block' }}>
                        {e}
                    </span>
                ))}
            </Table.Cell>
            {info.propertyNames.map((p) => (
                <Table.Cell key={p}>{view.sequence.properties?.[p]}</Table.Cell>
            ))}
        </Table.Row>
    );
}

function FeatureTrack({
    model,
    view,
    offset,
    hasChildren,
}: {
    model: FeatureViewModel;
    view: Feature;
    offset: number;
    hasChildren?: boolean;
}) {
    const trackRef = useRef<HTMLTableCellElement>(null);
    const { info, viewState } = model;

    useEffect(() => {
        const sub = model.state.highlight.subscribe((h) => {
            const start = h ? h.start : Number.MAX_VALUE;
            const end = h ? (h.end ?? h.start) : -Number.MAX_VALUE;

            const { elements } = view;
            const children = trackRef.current!.children;

            // can be optimized by storing the previous highlight
            for (let i = 0; i < elements.length; i++) {
                if (h && FeatureUtils.elementOverlaps(elements[i], start, end)) {
                    (children[i] as HTMLElement).style.backgroundColor = 'orange';
                } else {
                    (children[i] as HTMLElement).style.backgroundColor = 'transparent';
                }
            }
        });
        return () => sub.unsubscribe();
    }, [view]);

    return (
        <Table.Row
            bg={viewState.currentEntityId === view.id ? '#222' : undefined}
            onClick={() => model.toggleCurrent(view.id)}
        >
            <Table.Cell paddingLeft={2 * offset}>
                {hasChildren && <ToggleChildren model={model} id={view.id} />}
                <ToggleCurrent model={model} id={view.id} title={view.title ?? view.kind} />
            </Table.Cell>
            <Table.Cell
                position='relative'
                style={{ fontFamily: 'monospace' }}
                ref={trackRef}
                onMouseMove={(e) => {
                    const offset = (e.target as HTMLElement).getAttribute('data-offset');
                    if (!offset) model.state.highlight.next(undefined);
                    else {
                        const el = view.elements[+offset];
                        model.state.highlight.next({
                            start: el.start,
                            end: el.end,
                            view,
                            element: el,
                        });
                    }
                }}
                onMouseLeave={() => model.state.highlight.next(undefined)}
            >
                {view.elements.map((el, i) => (
                    <div
                        key={i}
                        data-offset={i}
                        style={{
                            position: 'absolute',
                            top: 8,
                            cursor: 'pointer',
                            left: BaseWidth * el.start + 8,
                            width: ((el.end ?? el.start) - el.start + 1) * BaseWidth,
                            border: '1px dotted #444',
                            textAlign: 'center',
                        }}
                    >
                        {el.value}
                    </div>
                ))}
            </Table.Cell>
            {info.propertyNames.map((p) => (
                <Table.Cell key={p}>{view.properties?.[p]}</Table.Cell>
            ))}
        </Table.Row>
    );
}

function ToggleChildren({ model, id }: { model: FeatureViewModel; id: EntityId }) {
    const { expandedIds } = model.viewState;
    return (
        <Button variant='ghost' onClick={() => model.toggleExpanded(id)} size='sm' style={{ height: 'unset' }}>
            {expandedIds.includes(id) ? <LuMinus /> : <LuPlus />}
        </Button>
    );
}

function ToggleCurrent({ model, id, title }: { model: FeatureViewModel; id: EntityId; title: string }) {
    return (
        <Button variant='ghost' onClick={() => model.toggleCurrent(id)} size='sm' style={{ height: 'unset' }}>
            {title}
        </Button>
    );
}
