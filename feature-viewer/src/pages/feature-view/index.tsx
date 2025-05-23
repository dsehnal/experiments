import { AsyncWrapper } from '@/lib/components/async-wrapper';
import { useAsyncModel } from '@/lib/hooks/use-async-model';
import { ReactiveModel } from '@/lib/reactive-model';
import { Box, Button, Flex } from '@chakra-ui/react';
import { Layout } from '../layout';
import { SettingsBreadcrumb } from './common';
import { exampleFeatureView } from './example-data';
import { FeatureViewModel, FeatureViewUI } from './features';
import { View3DUI, View3DModel } from './3d-view';
import { useReactiveModel } from '@/lib/hooks/use-reactive-model';
import { FeatureUtils, FeatureView } from './data';
import { BehaviorSubject, combineLatest } from 'rxjs';

const ExampleViews: FeatureView[] = [exampleFeatureView(60), exampleFeatureView(50), exampleFeatureView(65)];

class FeatureExampleModel extends ReactiveModel {
    features = new FeatureViewModel();
    view3d = new View3DModel();

    state = {
        current: new BehaviorSubject<FeatureView>(ExampleViews[0]),
    };

    get current() {
        return this.state.current.value;
    }

    async init() {}

    mount(): void {
        this.subscribe(this.state.current, (w) => {
            this.features.state.view.next(w);
        });

        this.subscribe(combineLatest([this.state.current, this.features.state.highlight]), ([_, h]) => {
            if (!h) {
                this.view3d.state.highlight.next('nothing');
                return;
            }

            this.view3d.state.highlight.next(`Start: ${h.start}, End: ${h.end ?? '-'}`);
        });

        this.subscribe(combineLatest([this.state.current, this.features.state.state]), ([view, state]) => {
            if (!state.currentEntityId || !view) {
                this.view3d.state.data.next(undefined);
                return;
            }
            const entity = FeatureUtils.findEntity(view, state.currentEntityId);
            if (!entity) {
                this.view3d.state.data.next(undefined);
                return;
            }
            this.view3d.state.data.next({ id: entity.node.id, type: entity.node.type });
        });
    }
}

async function createModel() {
    const model = new FeatureExampleModel();
    await model.init();
    return model;
}

export function ExampleUI() {
    const { model, loading, error } = useAsyncModel(createModel);
    useReactiveModel(model);

    return (
        <Layout breadcrumbs={[SettingsBreadcrumb]}>
            <AsyncWrapper loading={!model || loading} error={error}>
                <Root model={model!} />
            </AsyncWrapper>
        </Layout>
    );
}

function Root({ model }: { model: FeatureExampleModel }) {
    return (
        <Flex flexDirection='column' p={2} gap={2} h='full'>
            <Box borderWidth='1px' flexGrow={1}>
                <View3DUI model={model.view3d} />
            </Box>
            <Box borderWidth='1px'>
                <FeatureViewUI model={model.features} />
            </Box>
            <Flex gap={2}>
                {ExampleViews.map((w, i) => (
                    <Button flexGrow={1} key={i} variant='subtle' onClick={() => model.state.current.next(w)}>
                        View {i + 1}
                    </Button>
                ))}
            </Flex>
            <Box textAlign='center'>
                Views could be generated dynamically for example by applying filters to properties associated with
                sequences
            </Box>
        </Flex>
    );
}
