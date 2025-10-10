"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';

interface UnsavedChangesContextType {
    hasUnsavedChanges: boolean;
    setHasUnsavedChanges: (hasChanges: boolean) => void;
    checkUnsavedChanges: (action: () => void) => void;
    pendingAction: (() => void) | null;
    setPendingAction: (action: (() => void) | null) => void;
    showUnsavedChangesDialog: boolean;
    setShowUnsavedChangesDialog: (show: boolean) => void;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextType | undefined>(undefined);

export function UnsavedChangesProvider({ children }: { children: React.ReactNode }) {
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
    const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);

    const checkUnsavedChanges = useCallback((action: () => void) => {
        if (hasUnsavedChanges) {
            setPendingAction(() => action);
            setShowUnsavedChangesDialog(true);
        } else {
            action();
        }
    }, [hasUnsavedChanges]);

    return (
        <UnsavedChangesContext.Provider
            value={{
                hasUnsavedChanges,
                setHasUnsavedChanges,
                checkUnsavedChanges,
                pendingAction,
                setPendingAction,
                showUnsavedChangesDialog,
                setShowUnsavedChangesDialog,
            }}
        >
            {children}
        </UnsavedChangesContext.Provider>
    );
}

export function useUnsavedChanges() {
    const context = useContext(UnsavedChangesContext);
    if (context === undefined) {
        throw new Error('useUnsavedChanges must be used within an UnsavedChangesProvider');
    }
    return context;
}
