import { useRef } from "react";
import { Download, Upload } from "lucide-react";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { InteractiveHoverButton } from "@/components/magicui/interactive-hover-button";


interface DataImportExportProps {
    onImport: () => void;
    onExport: () => void;
    onClearAllData?: () => void;
}

export function DataImportExport({ onImport, onExport, onClearAllData }: DataImportExportProps) {
    const clearDialogRef = useRef<HTMLButtonElement>(null);
    return (
        <div className="flex gap-4 mb-6">
            <InteractiveHoverButton
                onClick={onExport}
                hoverColor="#059669"
                icon={<Upload className="w-4 h-4" />}
            >
                导出数据
            </InteractiveHoverButton>
            <InteractiveHoverButton
                onClick={onImport}
                hoverColor="#D97706"
                icon={<Download className="w-4 h-4" />}
            >
                导入数据
            </InteractiveHoverButton>
            {onClearAllData && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <InteractiveHoverButton ref={clearDialogRef} hoverColor="#EF4444">
                            清空所有数据
                        </InteractiveHoverButton>
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