import { useRef } from "react";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import ReactBitsButton from "@/components/ui/ReactBitsButton";
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
                        <ReactBitsButton 
                variant="outline" 
                onClick={onImport} 
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 hover:border-emerald-700"
            >
                <Download className="w-4 h-4 mr-2" />
                导入数据
            </ReactBitsButton>
            <ReactBitsButton 
                variant="outline" 
                onClick={onExport} 
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white border-amber-600 hover:border-amber-700"
            >
                <Upload className="w-4 h-4 mr-2" />
                导出数据
            </ReactBitsButton>
            {onClearAllData && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <ReactBitsButton variant="destructive" ref={clearDialogRef} size="sm">
                            清空所有数据
                        </ReactBitsButton>
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