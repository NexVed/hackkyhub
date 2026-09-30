import { Sidebar } from '@/components/Sidebar';
import { DashboardWelcome } from '@/components/dashboard/DashboardWelcome';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <DashboardWelcome><div className="dashboard-shell flex h-dvh min-h-0 w-full bg-dash-page overflow-hidden">
            <Sidebar />
            <main id="dashboard-content" className="min-w-0 flex-1 h-full overflow-y-auto overflow-x-hidden pt-16 pb-[env(safe-area-inset-bottom)] md:py-0">
                {children}
            </main>
        </div></DashboardWelcome>
    );
}
