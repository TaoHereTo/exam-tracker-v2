import { useRef } from "react";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { UnifiedButton } from "@/components/ui/UnifiedButton";
import { Download, Upload } from "lucide-react";

interface DataImportExportProps {
    onImport: () => void;
    onExport: () => void;
    onClearAllData?: () => void;
}

export function DataImportExport({ onImport, onExport, onClearAllData }: DataImportExportProps) {
    const clearDialogRef = useRef<HTMLButtonElement>(null);
    return (
        <div className="flex gap-4 mb-6">
            <UnifiedButton
                variant="reactbits"
                onClick={onImport}
                size="sm"
                style={{ background: '#D97706' }}
            >
                <Download className="w-4 h-4 mr-0" />
                导入数据
            </UnifiedButton>
            <UnifiedButton
                variant="reactbits"
                onClick={onExport}
                size="sm"
                style={{ background: '#059669' }}
            >
                <Upload className="w-4 h-4 mr-0" />
                导出数据
            </UnifiedButton>
            {onClearAllData && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <UnifiedButton variant="reactbits" ref={clearDialogRef} size="sm" style={{ background: '#EF4444' }}>
                            清空所有数据
                        </UnifiedButton>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>您确定要清空所有数据吗？</AlertDialogTitle>
                            <AlertDialogDescription>此操作将永久删除所有刷题记录和知识点，无法撤销。</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction onClick={onClearAllData}>确认清空</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
    );
} 