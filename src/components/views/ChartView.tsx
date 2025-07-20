import React from "react";
import type { RecordItem } from "@/components/forms/NewRecordForm";

export function ChartView({ records }: { records: RecordItem[] }) {
    return (
        <div>
            <h2 className="text-xl font-bold mb-4">图表视图</h2>
            {/* 这里将来放图表内容 */}
        </div>
    );
} 