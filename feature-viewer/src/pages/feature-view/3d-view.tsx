import { useBehavior } from '@/lib/hooks/use-behavior';
import { ReactiveModel } from '@/lib/reactive-model';
import { Box } from '@chakra-ui/react';
import { BehaviorSubject } from 'rxjs';

export class View3DModel extends ReactiveModel {
    state = {
        data: new BehaviorSubject<string>('empty'),
        highlight: new BehaviorSubject<string>('nothing'),
    };
}

export function View3DUI({ model }: { model: View3DModel }) {
    const data = useBehavior(model.state.data);
    const highlight = useBehavior(model.state.highlight);

    return (
        <Box p={2}>
            <Box>
                <b>3D View</b>
            </Box>
            <Box>Data: {data}</Box>
            <Box>Highlight: {highlight}</Box>
        </Box>
    );
}
