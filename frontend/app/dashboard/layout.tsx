import { Sidebar } from '@/components/Sidebar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen w-full bg-[#fafafa] dark:bg-[#121212] overflow-hidden">
            <Sidebar />
            <main className="flex-1 h-full overflow-y-auto overflow-x-hidden">
                {children}
            </main>
        </div>
    );
}
