import KnowledgeEntryView from "@/components/views/KnowledgeEntryView";

export function KnowledgeEntryTabView({ onAddKnowledge }: { onAddKnowledge: (k: any) => void }) {
    return (
        <div>
            <h1 className="text-3xl font-bold mb-4">知识点录入</h1>
            <KnowledgeEntryView onAddKnowledge={onAddKnowledge} />
        </div>
    );
} 