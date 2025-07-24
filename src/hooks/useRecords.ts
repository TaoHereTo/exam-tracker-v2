import { useState } from "react";

export interface RecordItem {
    id: number;
    date: string;
    module: string;
    total: number;
    correct: number;
    duration: string;
}

// useRecords 已被移除，全部由 useLocalStorageState 取代 