import { AlignedSequence, FeatureView, RootFeature } from '@/pages/feature-view/data';
import { uuid4 } from '@/lib/util/uuid';

const characters = '-ACDEFGHIKLMNPQRSTVWY';

function randomProps(names: string[]) {
    return Object.fromEntries(names.map((n) => [n, Math.round(100 * Math.random()) / 10]));
}

function generateSequence(title: string, length: number): AlignedSequence {
    const seq: string[] = [];
    for (let i = 0; i < length; i++) {
        seq.push(characters[Math.floor(Math.random() * characters.length)]);
    }
    const data = seq.join('');
    const offset: number[] = new Array(seq.length);
    let o = 0;
    for (let i = 0; i < length; i++) {
        offset[i] = o;
        if (data[i] !== '-') o++;
    }

    return {
        type: 'aligned-sequence',
        id: uuid4(),
        sequence: { title, data, properties: randomProps(['x', 'y']) },
        offset,
    };
}

export function exampleFeatureView(width: number): FeatureView {
    return {
        node: RootFeature,
        children: [
            {
                node: generateSequence('A', width),
                children: [
                    {
                        node: {
                            id: uuid4(),
                            type: 'feature',
                            kind: 'secondary-structure',
                            elements: [
                                { start: 5, end: 10, value: 'helix' },
                                { start: 12, end: 17, value: 'sheet' },
                                { start: 18, end: 22, value: 'loop' },
                                { start: 30, end: 36, value: 'helix' },
                            ],
                            title: 'Sec. Struct',
                        },
                    },
                ],
            },
            {
                node: generateSequence('B', width),
                children: [
                    {
                        node: {
                            id: uuid4(),
                            type: 'feature',
                            kind: 'mutation-count',
                            elements: [
                                { start: 5, value: 1 },
                                { start: 15, value: 3 },
                                { start: 18, value: 2 },
                            ],
                            title: 'Total Mutation Count',
                        },
                        children: [
                            {
                                node: {
                                    id: uuid4(),
                                    type: 'feature',
                                    kind: 'mutation-count',
                                    elements: [
                                        { start: 5, end: 7, value: 1 },
                                        { start: 15, value: 1 },
                                        { start: 18, value: 1 },
                                    ],
                                    title: 'Insertion',
                                },
                            },
                            {
                                node: {
                                    id: uuid4(),
                                    type: 'feature',
                                    kind: 'mutation-count',
                                    elements: [
                                        { start: 5, value: 0 },
                                        { start: 15, value: 2 },
                                        { start: 18, value: 0 },
                                    ],
                                    title: 'Deletion',
                                },
                            },
                            {
                                node: {
                                    id: uuid4(),
                                    type: 'feature',
                                    kind: 'mutation-count',
                                    elements: [
                                        { start: 5, value: 0 },
                                        { start: 15, value: 0 },
                                        { start: 18, value: 1 },
                                    ],
                                    title: 'Substitution',
                                },
                            },
                        ],
                    },
                ],
            },
        ],
    };
}
