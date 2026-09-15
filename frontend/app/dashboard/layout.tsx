import { Sidebar } from '@/components/Sidebar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-dvh min-h-0 w-full bg-[#fafafa] dark:bg-[#121212] overflow-hidden">
            <Sidebar />
            <main className="min-w-0 flex-1 h-full overflow-y-auto overflow-x-hidden pt-16 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:py-0">
                {children}
            </main>
        </div>
    );
}
