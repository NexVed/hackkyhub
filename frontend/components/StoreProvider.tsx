'use client'
import { useEffect, useState } from 'react'
import { Provider } from 'react-redux'
import { makeStore } from '@/lib/store'
import { setupListeners } from '@reduxjs/toolkit/query'
import { resetDashboardState } from '@/lib/store/dashboardSlice'
import { dashboardApi } from '@/lib/store/dashboardApi'
import { useConvexAuth } from 'convex/react'
import { WELCOME_SESSION_KEY } from '@/lib/welcome'
import { setMobileMenuOpen } from '@/lib/store/sidebarSlice'

export default function StoreProvider({
    children
}: {
    children: React.ReactNode
}) {
    const [store] = useState(() => makeStore())
    const { isAuthenticated, isLoading } = useConvexAuth()
    useEffect(() => setupListeners(store.dispatch), [store])
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            try { sessionStorage.removeItem(WELCOME_SESSION_KEY) } catch {}
            store.dispatch(setMobileMenuOpen(false))
            store.dispatch(resetDashboardState())
            store.dispatch(dashboardApi.util.resetApiState())
        }
    }, [store, isAuthenticated, isLoading])

    return <Provider store={store}>{children}</Provider>
}
