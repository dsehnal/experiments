import { BrowserRouter, HashRouter, Route, Routes } from 'react-router';
import { Toaster } from './components/ui/toaster';
import { DialogProvider } from './lib/services/dialog';
import { RoutingKind } from './pages/routing';
import { ExampleUI } from './pages/feature-view';
import { Layout } from './pages/layout';
import { Box } from '@chakra-ui/react';

const Pages = [['feature-view', <ExampleUI />]] as const;

export function UIRoot() {
    const Router = RoutingKind === 'browser' ? BrowserRouter : HashRouter;
    return (
        <>
            <Router>
                <Routes>
                    {Pages.map(([path, index]) => (
                        <Route path={path} key={path}>
                            <Route index element={index} />
                        </Route>
                    ))}
                    <Route path='/' element={Pages[0][1]} />
                    <Route path='*' element={<NotFound />} />
                </Routes>
            </Router>
            <Toaster />
            <DialogProvider />
        </>
    );
}

function NotFound() {
    return (
        <Layout>
            <Box>Not Found</Box>
        </Layout>
    );
}
