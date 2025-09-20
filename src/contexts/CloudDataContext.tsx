'use client'

import React, { createContext, useContext, useState } from 'react'

interface CloudDataContextType {
    isCloudDataLoading: boolean
    setIsCloudDataLoading: (loading: boolean) => void
}

const CloudDataContext = createContext<CloudDataContextType | undefined>(undefined)

export function CloudDataProvider({ children }: { children: React.ReactNode }) {
    const [isCloudDataLoading, setIsCloudDataLoading] = useState(false)

    return (
        <CloudDataContext.Provider value={{ isCloudDataLoading, setIsCloudDataLoading }}>
            {children}
        </CloudDataContext.Provider>
    )
}

export function useCloudData() {
    const context = useContext(CloudDataContext)
    if (context === undefined) {
        throw new Error('useCloudData must be used within a CloudDataProvider')
    }
    return context
}
