import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface KnowledgeSummaryViewProps {
    knowledge: any[];
}

const MODULES = [
    { value: 'data-analysis', label: '资料分析' },
    { value: 'politics', label: '政治理论' },
    { value: 'math', label: '数量关系' },
    { value: 'common', label: '常识判断' },
    { value: 'verbal', label: '言语理解' },
    { value: 'logic', label: '判断推理' },
];

const getColumns = (module: string) => {
    switch (module) {
        case 'data-analysis':
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
        case 'math':
            return [
                { key: 'type', label: '类型' },
                { key: 'note', label: '技巧记录' },
            ];
        case 'common':
            return [
                { key: 'type', label: '类型' },
                { key: 'note', label: '技巧记录' },
            ];
        case 'verbal':
            return [
                { key: 'idiom', label: '成语' },
                { key: 'meaning', label: '含义' },
            ];
        case 'logic':
            return [
                { key: 'type', label: '类型' },
                { key: 'note', label: '技巧记录' },
            ];
        default:
            return [];
    }
};

const KnowledgeSummaryView: React.FC<KnowledgeSummaryViewProps> = ({ knowledge }) => {
    const [selectedModule, setSelectedModule] = useState('data-analysis');
    const columns = getColumns(selectedModule);
    // 假设每条数据有 module 字段标识来源模块，否则可根据录入时加上
    const filtered = knowledge.filter(item => item.module === selectedModule);

    return (
        <Card className="max-w-3xl mx-auto">
            <CardHeader>
                <CardTitle>知识点汇总</CardTitle>
            </CardHeader>
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
                    <table className="min-w-full border text-sm">
                        <thead>
                            <tr>
                                {columns.map(col => (
                                    <th key={col.key} className="border px-4 py-2 bg-gray-100 dark:bg-gray-800 dark:text-gray-100">{col.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={columns.length} className="text-center py-4 text-gray-400">暂无数据</td></tr>
                            ) : (
                                filtered.map((row, idx) => (
                                    <tr key={idx}>
                                        {columns.map(col => (
                                            <td key={col.key} className="border px-4 py-2">
                                                {(() => {
                                                    const value = row[col.key];
                                                    if (value instanceof Date) {
                                                        return value.toLocaleDateString();
                                                    } else if (typeof value === 'string') {
                                                        // 尝试解析为日期字符串
                                                        const d = new Date(value);
                                                        if (col.key === 'date' && !isNaN(d.getTime()) && value.length > 6) {
                                                            return d.toLocaleDateString();
                                                        }
                                                        return value;
                                                    } else {
                                                        return value ?? '';
                                                    }
                                                })()}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};

export default KnowledgeSummaryView; 