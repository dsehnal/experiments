import { Box, Flex } from '@chakra-ui/react';
import { ReactNode } from 'react';
import { BreadcrumbLink, BreadcrumbRoot } from '@/components/ui/breadcrumb';
import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from '@/components/ui/menu';
import { LuChevronDown, LuTableRowsSplit } from 'react-icons/lu';
import { useNavigate, Link } from 'react-router';
import { resolveRoute } from './routing';
import { SettingsBreadcrumb } from './feature-view/common';

export interface BreadcrumbItem {
    icon?: ReactNode;
    title: ReactNode;
    path?: string;
}

export interface LayoutProps {
    breadcrumbs?: (BreadcrumbItem | undefined)[];
    children: ReactNode;
    buttons?: ReactNode;
}

const Pages = [SettingsBreadcrumb];

export function Layout({ breadcrumbs, children, buttons }: LayoutProps) {
    const navigate = useNavigate();

    const BL = BreadcrumbLink as any;

    return (
        <Flex h='100%' w='full' flexDir='column'>
            <Flex alignItems='center' bg='gray.800'>
                <BreadcrumbRoot px={4} py={3}>
                    <MenuRoot onSelect={(e) => navigate(resolveRoute(e.value))}>
                        <MenuTrigger asChild>
                            <BreadcrumbLink as='button'>
                                <LuTableRowsSplit /> Root <LuChevronDown />
                            </BreadcrumbLink>
                        </MenuTrigger>
                        <MenuContent>
                            {Pages.map((b) => (
                                <MenuItem key={b.path} value={b.path!}>
                                    {b.icon} {b.title}
                                </MenuItem>
                            ))}
                        </MenuContent>
                    </MenuRoot>

                    {breadcrumbs?.map((b, i) =>
                        !b ? undefined : (
                            <BL key={i} as={Link} to={b.path ? resolveRoute(b.path) : undefined}>
                                {b.icon} {b.title}
                            </BL>
                        )
                    )}
                </BreadcrumbRoot>
                <Box margin='auto' />
                {buttons}
                <Box w={2} />
            </Flex>
            <Box flexGrow={1} position='relative' bg='gray.950'>
                <Box position='absolute' inset={0} px={2} py={2} overflow='hidden' overflowY='auto'>
                    {children}
                </Box>
            </Box>
        </Flex>
    );
}
