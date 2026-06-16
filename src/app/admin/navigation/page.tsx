import prisma from '@/lib/prisma';
import NavigationClient from './NavigationClient';

export default async function NavigationManagerPage() {
  const headerMenus = await prisma.navigationMenu.findMany({
    where: { parentId: null, isFooter: false },
    include: { children: { orderBy: { order: 'asc' } } },
    orderBy: { order: 'asc' }
  });

  const footerMenus = await prisma.navigationMenu.findMany({
    where: { parentId: null, isFooter: true },
    include: { children: { orderBy: { order: 'asc' } } },
    orderBy: { order: 'asc' }
  });

  return <NavigationClient initialHeaderMenus={headerMenus} initialFooterMenus={footerMenus} />;
}
