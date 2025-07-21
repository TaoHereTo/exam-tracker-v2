import KnowledgeEntryView from "@/components/views/KnowledgeEntryView";

export function KnowledgeEntryTabView({ onAddKnowledge }: { onAddKnowledge: (k: any) => void }) {
    return (
        <div>
            <h1 className="text-3xl font-bold mb-4">知识点录入</h1>
            <div className="flex flex-col items-center justify-center min-h-[80vh] mt-0">
                <KnowledgeEntryView onAddKnowledge={onAddKnowledge} />
            </div>
        </div>
    );
} 