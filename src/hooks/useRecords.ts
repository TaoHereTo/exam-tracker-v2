import { useState } from "react";

export interface RecordItem {
    id: number;
    date: string;
    module: string;
    total: number;
    correct: number;
    duration: string;
}

export function useRecords(initialRecords: RecordItem[] = []) {
    const [records, setRecords] = useState<RecordItem[]>(initialRecords);

    const addRecord = (record: RecordItem) => setRecords(prev => [record, ...prev]);
    const deleteRecord = (id: number) => setRecords(prev => prev.filter(r => r.id !== id));
    const batchDeleteRecords = (ids: number[]) => setRecords(prev => prev.filter(r => !ids.includes(r.id)));

    return {
        records,
        setRecords,
        addRecord,
        deleteRecord,
        batchDeleteRecords,
    };
} 