import React, { useState } from 'react';
import { BeautifulPagination } from './BeautifulPagination';
import { Card, CardContent, CardHeader, CardTitle } from './card';

export function PaginationDemo() {
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = 7;

    return (
        <div className="space-y-6 p-6">
            <Card>
                <CardHeader>
                    <CardTitle>分页器样式对比</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                              <div>
            <h3 className="text-lg font-medium mb-2">新的简洁分页器</h3>
            <p className="text-sm text-muted-foreground mb-4">
              这个分页器采用了更简洁的设计，左侧显示页码信息，右侧只有4个导航按钮，不显示具体页码数字。
            </p>
            <BeautifulPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>

                    <div className="pt-4 border-t">
                        <h3 className="text-lg font-medium mb-2">当前状态</h3>
                        <p className="text-sm text-muted-foreground">
                            当前页码: {currentPage} / {totalPages}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 