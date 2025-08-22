import { useRef } from "react";
import { Download, Upload } from "lucide-react";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/ButtonGroup";
import { MixedText } from "@/components/ui/MixedText";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";


interface DataImportExportProps {
    onImport: () => void;
    onExport: () => void;
    onClearAllData?: () => void;
}

export function DataImportExport({ onImport, onExport, onClearAllData }: DataImportExportProps) {
    const clearDialogRef = useRef<HTMLButtonElement>(null);
    return (
        <TooltipProvider>
            <ButtonGroup spacing="md" margin="md">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            onClick={onExport}
                            variant="outline"
                            size="icon"
                            className="h-9 w-9"
                        >
                            <Upload className="w-5 h-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p><MixedText text="导出数据" /></p>
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            onClick={onImport}
                            variant="outline"
                            size="icon"
                            className="h-9 w-9"
                        >
                            <Download className="w-5 h-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p><MixedText text="导入数据" /></p>
                    </TooltipContent>
                </Tooltip>
                {onClearAllData && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button ref={clearDialogRef} variant="outline" size="icon" className="h-9 w-9 text-red-500 hover:text-red-700">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle><MixedText text="您确定要清空所有数据吗？" /></AlertDialogTitle>
                                <AlertDialogDescription><MixedText text="此操作将永久删除所有刷题历史和知识点，无法撤销。" /></AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel><MixedText text="取消" /></AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={onClearAllData}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                    <MixedText text="确认清空" />
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </ButtonGroup>
        </TooltipProvider>
    );
} 