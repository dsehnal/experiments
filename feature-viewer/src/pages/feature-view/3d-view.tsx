import { ReactiveModel } from '@/lib/reactive-model';
import { Box } from '@chakra-ui/react';
import { BehaviorSubject } from 'rxjs';

import { MVSData } from 'molstar/lib/extensions/mvs/mvs-data';
import { getMVSStoriesContext } from 'molstar/lib/apps/mvs-stories/context';
import 'molstar/build/mvs-stories/mvs-stories.js';
import 'molstar/build/mvs-stories/mvs-stories.css';
import { memo } from 'react';
import { useReactiveModel } from '@/lib/hooks/use-reactive-model';

export class View3DModel extends ReactiveModel {
    state = {
        data: new BehaviorSubject<{ id: string, type: string } | undefined>(undefined),
        highlight: new BehaviorSubject<string>('nothing'),
    };


    mount() {
        let i = 0;
        const idMapping = new Map<string, string>();
        this.subscribe(this.state.data, (data) => {
            if (!data) return;

            let id = idMapping.get(data.id);
            if (!id) {
                id = ids[i % ids.length];
                i++;
                idMapping.set(data.id, id);
            }

            const state = buildState(id);
            getMVSStoriesContext().dispatch({
                kind: 'load-mvs',
                format: 'mvsj',
                data: state,
            });
        });
    }
}

const ids = [
    '1tqn',
    '1cbs',
];

function buildState(id: string) {
    const builder = MVSData.createBuilder();
    const structure = builder
        .download({ url: `https://www.ebi.ac.uk/pdbe/entry-files/${id}.bcif` })
        .parse({ format: 'bcif' })
        .modelStructure({});
    structure
        .component({ selector: 'polymer' })
        .representation({ type: 'cartoon' })
        .color({ color: 'green' });
    return builder.getState();
}

export function View3DUI({ model }: { model: View3DModel }) {
    // const data = useBehavior(model.state.data);
    // const highlight = useBehavior(model.state.highlight);
    useReactiveModel(model);

    return (
        <Box p={2} h='full'>
            <Box w='full' h='full' pos='relative'>
                <Viewer />
            </Box>
            {/* <Box>Data: {data}</Box>
            <Box>Highlight: {highlight}</Box> */}
        </Box>
    );
}


declare module "react" {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace JSX {
        interface IntrinsicElements {
            'mvs-stories-viewer': any;
        }
    }
}

const Viewer = memo(() => {
    return <mvs-stories-viewer />;
});
