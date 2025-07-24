import { NewRecordForm } from "@/components/forms/NewRecordForm";
import type { RecordItem } from "@/types/record";

export function NewRecordView({ onAddRecord }: { onAddRecord: (record: RecordItem) => void }) {
    return (
        <div>
            <h1 className="text-3xl font-bold mb-4">新增刷题记录</h1>
            <div className="flex flex-col items-center justify-center min-h-[80vh] mt-0">
                <NewRecordForm onAddRecord={onAddRecord} />
            </div>
        </div>
    );
} 