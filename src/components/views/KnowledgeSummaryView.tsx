import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DataTable, DataTableColumn } from "@/components/ui/DataTable";

interface KnowledgeSummaryViewProps {
    knowledge: any[];
    onBatchDeleteKnowledge?: (ids: string[]) => void;
}

const MODULES = [
    { value: 'data-analysis', label: '资料分析' },
    { value: 'politics', label: '政治理论' },
    { value: 'math', label: '数量关系' },
    { value: 'common', label: '常识判断' },
    { value: 'verbal', label: '言语理解' },
    { value: 'logic', label: '判断推理' },
];

const getColumns = (module: string): DataTableColumn<any>[] => {
    switch (module) {
        case 'data-analysis':
        case 'math':
        case 'common':
        case 'logic':
            return [
                { key: 'type', label: '类型' },
                { key: 'note', label: '技巧记录' },
            ];
        case 'politics':
            return [
                { key: 'date', label: '发布日期' },
                { key: 'source', label: '文件来源' },
                { key: 'note', label: '相关重点' },
            ];
        case 'verbal':
            return [
                { key: 'idiom', label: '成语' },
                { key: 'meaning', label: '含义' },
            ];
        default:
            return [];
    }
};

const KnowledgeSummaryView: React.FC<KnowledgeSummaryViewProps> = ({ knowledge, onBatchDeleteKnowledge }) => {
    const [selectedModule, setSelectedModule] = useState('data-analysis');
    const [selectedRows, setSelectedRows] = useState<(string | number)[]>([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const columns = getColumns(selectedModule);
    const filtered = knowledge.filter(item => item.module === selectedModule);

    useEffect(() => {
        setSelectedRows([]);
    }, [knowledge, selectedModule]);

    const handleDeleteSelected = () => {
        if (!onBatchDeleteKnowledge) return;
        // 只传递string类型的id
        onBatchDeleteKnowledge(selectedRows.filter(id => typeof id === 'string') as string[]);
        setSelectedRows([]);
        setDeleteDialogOpen(false);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh]">
            <Card className="max-w-3xl w-full relative">
                <div className="absolute top-4 right-4 z-10">
                    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="destructive"
                                disabled={selectedRows.length === 0}
                                onClick={() => setDeleteDialogOpen(true)}
                            >
                                批量删除
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>确认批量删除？</AlertDialogTitle>
                                <AlertDialogDescription>
                                    此操作将删除所选的知识点，删除后无法恢复。是否确认？
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>取消</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteSelected}>确认删除</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
                <CardContent>
                    <div className="mb-4">
                        <Select value={selectedModule} onValueChange={setSelectedModule}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="请选择模块" />
                            </SelectTrigger>
                            <SelectContent>
                                {MODULES.map(m => (
                                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="overflow-x-auto">
                        <DataTable
                            columns={columns}
                            data={filtered}
                            selected={selectedRows.filter(id => typeof id === 'string') as string[]}
                            onSelect={v => setSelectedRows(v as (string | number)[])}
                            onBatchDelete={selectedRows.length > 0 ? () => setDeleteDialogOpen(true) : undefined}
                            rowKey={row => row.id}
                            batchDeleteText="批量删除"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default KnowledgeSummaryView; 