import { NewRecordForm } from "@/components/forms/NewRecordForm";

export function NewRecordView({ onAddRecord }: { onAddRecord: (record: any) => void }) {
    return (
        <div>
            <h1 className="text-3xl font-bold mb-4">新增刷题记录</h1>
            <NewRecordForm onAddRecord={onAddRecord} />
        </div>
    );
} 