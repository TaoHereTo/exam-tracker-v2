import React from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

export function HistoryTable() {
    return (
        <Table className="max-w-3xl mx-auto">
            <TableHeader>
                <TableRow>
                    <TableHead className="w-10 text-center"><Checkbox /></TableHead>
                    <TableHead>日期</TableHead>
                    <TableHead>模块</TableHead>
                    <TableHead>题目数</TableHead>
                    <TableHead>正确率</TableHead>
                    <TableHead>时长(分)</TableHead>
                    <TableHead>操作</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                <TableRow>
                    <TableCell className="text-center"><Checkbox /></TableCell>
                    <TableCell>2024-05-01</TableCell>
                    <TableCell>判断推理</TableCell>
                    <TableCell>40</TableCell>
                    <TableCell>85%</TableCell>
                    <TableCell>30</TableCell>
                    <TableCell><Button variant="destructive" size="sm">删除</Button></TableCell>
                </TableRow>
                <TableRow>
                    <TableCell className="text-center"><Checkbox /></TableCell>
                    <TableCell>2024-05-02</TableCell>
                    <TableCell>言语理解</TableCell>
                    <TableCell>35</TableCell>
                    <TableCell>91%</TableCell>
                    <TableCell>28</TableCell>
                    <TableCell><Button variant="destructive" size="sm">删除</Button></TableCell>
                </TableRow>
                <TableRow>
                    <TableCell className="text-center"><Checkbox /></TableCell>
                    <TableCell>2024-05-03</TableCell>
                    <TableCell>数量关系</TableCell>
                    <TableCell>25</TableCell>
                    <TableCell>76%</TableCell>
                    <TableCell>22</TableCell>
                    <TableCell><Button variant="destructive" size="sm">删除</Button></TableCell>
                </TableRow>
            </TableBody>
        </Table>
    );
} 