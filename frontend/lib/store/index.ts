import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import sidebarReducer from './sidebarSlice';
import dashboardReducer from './dashboardSlice';
import { dashboardApi } from './dashboardApi';

export const makeStore = () => {
    return configureStore({
        reducer: {
            sidebar: sidebarReducer,
            dashboard: dashboardReducer,
            [dashboardApi.reducerPath]: dashboardApi.reducer,
        },
        middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(dashboardApi.middleware),
    });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
