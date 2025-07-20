import { Button } from "@/components/ui/button";

export function DataImportExport({ onImport, onExport }: { onImport: () => void; onExport: () => void }) {
    return (
        <div className="flex gap-2">
            <Button variant="outline" onClick={onImport}>导入数据</Button>
            <Button variant="outline" onClick={onExport}>导出数据</Button>
        </div>
    );
} 