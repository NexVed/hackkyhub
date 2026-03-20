'use client';

import React from 'react';
import { Home, Trophy, Users, ChevronDown, Sun, Moon, LayoutDashboard, Settings, Folder, ChevronsLeft, Terminal, Code, Cpu, LogOut, User } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { setIsCollapsed, toggleIsCollapsed, setIsTeamsOpen, toggleIsTeamsOpen, setActiveAction, setActiveNav } from '@/lib/store/sidebarSlice';

interface SidebarProps {
    defaultCollapsed?: boolean;
}

export function Sidebar() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { isCollapsed, isTeamsOpen, activeAction, activeNav } = useAppSelector((state) => state.sidebar);

    // Expanded State
    return (
        <div className={`shrink-0 relative ${isCollapsed ? 'w-[68px]' : 'w-[260px]'} h-full flex flex-col rounded-r-2xl bg-white/20 dark:bg-black/30 backdrop-blur-2xl border-r border-white/40 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] text-slate-800 dark:text-slate-200 z-10 transition-all duration-300 ease-in-out`}>

            {/* Header / Brand */}
            <div className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-6'} pt-6 pb-2 mb-2 relative`}>
                <div className="flex items-center gap-3.5 cursor-pointer group">
                    <div className="relative flex items-center">
                        <img
                            src="/favicon.ico"
                            alt="Hackkyhub Logo"
                            className="w-[38px] h-[38px] rounded-[10px] object-contain drop-shadow-sm group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                                // Fallback icon in case favicon doesn't exist
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600 dark:text-white"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>';
                            }}
                        />
                    </div>
                    {!isCollapsed && (
                        <span className="text-[19px] font-bold text-slate-900 dark:text-white tracking-wide whitespace-nowrap overflow-hidden text-ellipsis">
                            Hackky Hub
                        </span>
                    )}
                </div>
                {/* Collapse Toggle Button */}
                <button
                    onClick={() => dispatch(toggleIsCollapsed())}
                    className="absolute w-[28px] h-[28px] right-[-14px] top-[26px] z-50 flex items-center justify-center rounded-2xl bg-white dark:bg-[#1a1a1c] border border-slate-200 dark:border-slate-700/50 shadow-sm text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-all duration-300"
                    title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    <ChevronsLeft className={`w-[16px] h-[16px] transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} strokeWidth={2.5} />
                </button>
            </div>

            {/* Divider */}
            <div className="h-[2px] bg-gradient-to-r from-transparent via-black/10 dark:via-white/10 to-transparent" />
            {/* Main Nav */}
            <nav className="flex-1 relative overflow-hidden flex flex-col custom-scrollbar">

                {/* Animated Left Indicator */}
                <div
                    className="absolute left-0 w-[4px] h-[36px] rounded-r-full transition-all duration-300 ease-out z-20"
                    style={{
                        top: activeNav === 'home' ? '8px' :
                            activeNav === 'hackathons' ? '48px' :
                                activeNav === 'find' ? (isCollapsed ? '88px' : '92px') :
                                    activeNav === 'teams' ? (isCollapsed ? '140px' : '150px') :
                                        activeNav === 'dashboard' ? (
                                            isCollapsed ? '198px' : (isTeamsOpen ? '368px' : '210px')
                                        ) :
                                            activeNav === 'settings' ? (
                                                isCollapsed ? '238px' : (isTeamsOpen ? '410px' : '252px')
                                            ) : '8px',
                        backgroundColor: activeNav === 'home' ? '#ef4444' :
                            activeNav === 'hackathons' ? '#eab308' :
                                activeNav === 'find' ? '#a855f7' : // Purple
                                    activeNav === 'teams' ? '#3b82f6' : // Blue
                                        activeNav === 'dashboard' ? '#14b8a6' : // Teal
                                            activeNav === 'settings' ? '#6366f1' : 'transparent' // Indigo
                    }}
                />

                <div className="px-4 py-2 space-y-1.5 overflow-y-auto overflow-x-hidden">
                    <NavItem
                        icon={<Home className="w-[18px] h-[18px]" strokeWidth={2} />}
                        label="Home"
                        isActive={activeNav === 'home'}
                        activeColor="text-red-500 dark:text-red-400"
                        onClick={() => {
                            dispatch(setActiveNav('home'));
                            router.push('/dashboard/Home');
                        }}
                        isCollapsed={isCollapsed}
                    />
                    <NavItem
                        icon={<Trophy className="w-[18px] h-[18px]" strokeWidth={2} />}
                        label="MNC Hackathons"
                        isActive={activeNav === 'hackathons'}
                        activeColor="text-yellow-500 dark:text-yellow-400"
                        onClick={() => {
                            dispatch(setActiveNav('hackathons'));
                            router.push('/dashboard/MNC hackathons');
                        }}
                        isCollapsed={isCollapsed}
                    />
                    <NavItem
                        icon={<Users className="w-[18px] h-[18px]" strokeWidth={2} />}
                        label="Find"
                        isActive={activeNav === 'find'}
                        activeColor="text-purple-500 dark:text-purple-400"
                        onClick={() => {
                            dispatch(setActiveNav('find'));
                            router.push('/dashboard/Find');
                        }}
                        isCollapsed={isCollapsed}
                    />

                    {/* Teams Dropdown */}
                    <div className="mt-4 relative">
                        <button
                            title={isCollapsed ? "Teams" : undefined}
                            onClick={() => {
                                if (isCollapsed) {
                                    dispatch(setIsCollapsed(false));
                                    dispatch(setIsTeamsOpen(true));
                                } else {
                                    dispatch(toggleIsTeamsOpen());
                                }
                                dispatch(setActiveNav('teams'));
                                router.push('/dashboard/Teams');
                            }}
                            className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2.5 text-sm font-semibold rounded-xl border shadow-sm transition-all group ${activeNav === 'teams'
                                ? 'bg-white/40 dark:bg-white/10 border-blue-200/50 dark:border-blue-500/20'
                                : 'bg-white/30 dark:bg-white/10 border-white/50 dark:border-white/10 hover:bg-white/40 dark:hover:bg-white/15'
                                }`}
                        >
                            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                                <Folder className={`w-[18px] h-[18px] transition-all ${activeNav === 'teams'
                                    ? 'text-blue-500 dark:text-blue-400 fill-blue-500/20'
                                    : 'text-blue-600 dark:text-blue-400 group-hover:fill-blue-600/20'
                                    }`} strokeWidth={2.5} />
                                {!isCollapsed && (
                                    <span className={activeNav === 'teams' ? 'text-blue-600 dark:text-blue-300' : 'text-blue-900 dark:text-blue-100'}>
                                        Teams
                                    </span>
                                )}
                            </div>
                            {!isCollapsed && (
                                <ChevronDown className={`w-[18px] h-[18px] transition-transform duration-300 ${isTeamsOpen ? '' : '-rotate-90'} ${activeNav === 'teams' ? 'text-blue-500 dark:text-blue-400' : 'text-blue-600 dark:text-blue-400'
                                    }`} strokeWidth={2.5} />
                            )}
                        </button>

                        {!isCollapsed && (
                            <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${isTeamsOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                <div className="overflow-hidden">
                                    {/* Nested Tree List */}
                                    <div className="flex flex-col ml-[25px] relative mt-0.5">
                                        <TreeItem title="Algorithm Aces" icon={<Terminal className="w-[18px] h-[18px]" strokeWidth={2} />} isActive={true} status="online" />
                                        <TreeItem title="Pixel Perfect" icon={<Code className="w-[18px] h-[18px]" strokeWidth={2} />} status="offline" />
                                        <TreeItem title="Code Crushers" icon={<Cpu className="w-[18px] h-[18px]" strokeWidth={2} />} isLast={true} status="online" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-2 transition-all duration-300" />

                    <NavItem
                        icon={<LayoutDashboard className="w-[18px] h-[18px]" strokeWidth={2} />}
                        label="Dashboard"
                        isActive={activeNav === 'dashboard'}
                        activeColor="text-teal-500 dark:text-teal-400"
                        onClick={() => {
                            dispatch(setActiveNav('dashboard'));
                            router.push('/dashboard');
                        }}
                        isCollapsed={isCollapsed}
                    />
                    <NavItem
                        icon={<User className="w-[18px] h-[18px]" strokeWidth={2} />}
                        label="Profile"
                        isActive={activeNav === 'profile'}
                        activeColor="text-pink-500 dark:text-pink-400"
                        onClick={() => {
                            dispatch(setActiveNav('profile'));
                            router.push('/dashboard/Profile');
                        }}
                        isCollapsed={isCollapsed}
                    />
                    <NavItem
                        icon={<Settings className="w-[18px] h-[18px]" strokeWidth={2} />}
                        label="Settings"
                        isActive={activeNav === 'settings'}
                        activeColor="text-indigo-500 dark:text-indigo-400"
                        onClick={() => {
                            dispatch(setActiveNav('settings'));
                            router.push('/dashboard/Settings');
                        }}
                        isCollapsed={isCollapsed}
                    />
                </div>
            </nav>

            {isCollapsed ? (
                <div className="mx-auto mt-auto mb-4 relative flex flex-col items-center p-[6px] w-[46px] h-[100px] bg-[#f0f2f5] dark:bg-[#202022] rounded-full shadow-[inset_0_1px_4px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_6px_rgba(0,0,0,0.4)]">
                    {/* Active Highlight Positioner Vertical */}
                    <div
                        className="absolute left-[6px] right-[6px] h-[42px] bg-white dark:bg-[#2a2a2d] rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-out z-0"
                        style={{ transform: activeAction === 'sun' ? 'translateY(0)' : 'translateY(100%)' }}
                    />
                    <button
                        title="Light Mode"
                        onClick={() => dispatch(setActiveAction('sun'))}
                        className={`relative z-10 w-full h-1/2 flex items-center justify-center rounded-full transition-colors duration-300 ${activeAction === 'sun'
                            ? 'text-slate-900 dark:text-white'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        <Sun className="w-[18px] h-[18px]" strokeWidth={2.5} />
                    </button>
                    <button
                        title="Dark Mode"
                        onClick={() => dispatch(setActiveAction('moon'))}
                        className={`relative z-10 w-full h-1/2 flex items-center justify-center rounded-full transition-colors duration-300 ${activeAction === 'moon'
                            ? 'text-slate-900 dark:text-white'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        <Moon className="w-[18px] h-[18px]" strokeWidth={2.5} />
                    </button>
                </div>
            ) : (
                <div className="mx-4 mt-auto mb-2 relative flex flex-row items-center p-[5px] bg-slate-100/80 dark:bg-[#202022] rounded-full shadow-[inset_0_1px_4px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_6px_rgba(0,0,0,0.4)]">
                    {/* Active Highlight Positioner */}
                    <div
                        className="absolute top-[5px] bottom-[5px] w-[calc(50%-5px)] bg-white dark:bg-white rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-out z-0"
                        style={{ transform: activeAction === 'sun' ? 'translateX(0)' : 'translateX(100%)' }}
                    />

                    <button
                        onClick={() => dispatch(setActiveAction('sun'))}
                        className={`relative z-10 w-1/2 flex items-center justify-center gap-2 py-2 text-[14px] font-semibold transition-colors duration-300 ${activeAction === 'sun'
                            ? 'text-slate-900'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        <Sun className="w-[16px] h-[16px]" strokeWidth={2.5} />
                        <span>Light</span>
                    </button>

                    <button
                        onClick={() => dispatch(setActiveAction('moon'))}
                        className={`relative z-10 w-1/2 flex items-center justify-center gap-2 py-2 text-[14px] font-semibold transition-colors duration-300 ${activeAction === 'moon'
                            ? 'text-slate-900'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        <Moon className="w-[16px] h-[16px]" strokeWidth={2.5} />
                        <span>Dark</span>
                    </button>
                </div>
            )}

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-black/10 dark:via-white/10 to-transparent my-1 mx-4" />

            {/* Bottom User / Settings */}
            <div className={`p-2 flex ${isCollapsed ? 'flex-col items-center' : 'flex-col'} gap-2`}>
                <div className={`flex ${isCollapsed ? 'flex-col items-center justify-center pb-[3px] pt-1 px-1 gap-2' : 'items-center justify-between p-2'} rounded-xl hover:bg-white/20 dark:hover:bg-white/5 transition-colors cursor-pointer group`}>
                    <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'gap-3'}`}>
                        <div className="relative shrink-0">
                            <img src="https://i.pravatar.cc/150?u=vitaliy" alt="Vitaliy D." className="w-10 h-10 rounded-full border-2 border-white/50 dark:border-white/20 shadow-md" />
                            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#27C93F] border-2 border-white dark:border-slate-800"></div>
                        </div>
                        {!isCollapsed && (
                            <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-sm truncate opacity-100 transition-opacity">Vitaliy D.</span>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate opacity-100 transition-opacity">Pro Member</span>
                            </div>
                        )}
                    </div>

                    {/* Logout Button */}
                    <button
                        className={`flex items-center justify-center ${isCollapsed ? 'w-10 h-10 mt-1 mb-2' : 'w-8 h-8'} rounded-lg bg-[#F04C68] text-white shadow-sm transition-all shrink-0 hover:scale-105`}
                        title="Logout"
                    >
                        <LogOut className="w-4 h-4 ml-0.5" strokeWidth={2.5} />
                    </button>
                </div>
            </div>

        </div >
    );
}

function NavItem({
    icon,
    label,
    isActive = false,
    activeColor = "text-indigo-600 dark:text-indigo-400",
    onClick,
    isCollapsed = false
}: {
    icon: React.ReactNode;
    label: string;
    isActive?: boolean;
    activeColor?: string;
    onClick?: () => void;
    isCollapsed?: boolean;
}) {
    return (
        <button
            title={isCollapsed ? label : undefined}
            onClick={onClick}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-start px-3 gap-3'} py-2 text-[14px] font-medium rounded-xl transition-all ${isActive
                ? `bg-white/40 dark:bg-white/10 ${activeColor}`
                : 'text-slate-600 dark:text-slate-300 hover:bg-white/30 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                }`}
        >
            {icon}
            {!isCollapsed && <span>{label}</span>}
        </button>
    );
}


function TreeItem({ title, icon, isLast = false, isActive = false, status }: { title: string, icon?: React.ReactNode, isLast?: boolean, isActive?: boolean, status?: 'online' | 'offline' }) {
    return (
        <div className="relative group/item flex flex-col items-center justify-center">
            {/* The curve to the item */}
            <div className="absolute top-0 left-[-15px] w-[15px] h-[26px] border-l border-b border-indigo-200/80 dark:border-white/10 rounded-bl-[16px] z-0 transition-colors" />

            {/* The continuing vertical line IF NOT LAST */}
            {!isLast && (
                <div className="absolute top-[14px] left-[-15px] w-px bottom-0 bg-indigo-200/80 dark:bg-white/10 z-0 transition-colors" />
            )}

            <button className={`relative z-10 flex items-center gap-3 w-full h-[46px] px-4 my-[3px] text-[15px] font-semibold rounded-[15px] outline-none transition-all duration-300 ease-out group ${isActive
                ? 'bg-gradient-to-r from-[#f5f7fc] to-[#f8f9fc] dark:from-white/10 dark:to-transparent text-slate-800 dark:text-white shadow-[0_1px_8px_rgba(0,0,0,0.03),inset_0_0_0_1px_rgba(230,235,245,0.8)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 shadow-none hover:shadow-[inset_0_0_0_1px_rgba(230,235,245,0.5)]'
                }`}>
                {icon ? (
                    <div className={`flex items-center justify-center shrink-0 transition-all duration-300 ${isActive ? 'text-slate-800 dark:text-white' : 'text-slate-400 group-hover:text-slate-500 dark:text-slate-500'}`}>
                        {icon}
                    </div>
                ) : null}
                <span className="tracking-wide truncate flex-1 text-left">{title}</span>
                {status && (
                    <div className={`w-2 h-2 rounded-full shrink-0 shadow-sm ${status === 'online' ? 'bg-[#27C93F] shadow-[0_0_8px_rgba(39,201,63,0.5)]' : 'bg-[#FF5F56] shadow-[0_0_8px_rgba(255,95,86,0.5)]'}`} />
                )}
            </button>
        </div>
    )
}
