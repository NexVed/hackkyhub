import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SidebarState {
    isCollapsed: boolean;
    isTeamsOpen: boolean;
    activeAction: 'sun' | 'moon';
    activeNav: 'home' | 'hackathons' | 'find' | 'teams' | 'dashboard' | 'settings' | 'profile';
}

const initialState: SidebarState = {
    isCollapsed: false,
    isTeamsOpen: true,
    activeAction: 'sun',
    activeNav: 'home',
};

export const sidebarSlice = createSlice({
    name: 'sidebar',
    initialState,
    reducers: {
        setIsCollapsed: (state, action: PayloadAction<boolean>) => {
            state.isCollapsed = action.payload;
        },
        toggleIsCollapsed: (state) => {
            state.isCollapsed = !state.isCollapsed;
        },
        setIsTeamsOpen: (state, action: PayloadAction<boolean>) => {
            state.isTeamsOpen = action.payload;
        },
        toggleIsTeamsOpen: (state) => {
            state.isTeamsOpen = !state.isTeamsOpen;
        },
        setActiveAction: (state, action: PayloadAction<'sun' | 'moon'>) => {
            state.activeAction = action.payload;
        },
        setActiveNav: (state, action: PayloadAction<SidebarState['activeNav']>) => {
            state.activeNav = action.payload;
        },
    },
});

export const {
    setIsCollapsed,
    toggleIsCollapsed,
    setIsTeamsOpen,
    toggleIsTeamsOpen,
    setActiveAction,
    setActiveNav,
} = sidebarSlice.actions;

export default sidebarSlice.reducer;
