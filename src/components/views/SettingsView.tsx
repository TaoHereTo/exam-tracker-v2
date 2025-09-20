import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { DataImportExport } from "@/components/features/DataImportExport";
import SaveSettingsButton from "./settings/SaveSettingsButton";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Download, Upload, Eye, Trash2, CloudUpload, CloudDownload } from "lucide-react";
import { useState } from "react";
import { CloudSyncService, UploadProgress } from "@/lib/cloudSyncService";
import { useNotification } from "@/components/magicui/NotificationProvider";
import { CloudDataOverview } from "@/components/views/CloudDataOverview";
import { SyncReportItem } from "@/types/common";
import { RecordItem, StudyPlan, KnowledgeItem, UserSettings } from "@/types/record";
import { MixedText } from "@/components/ui/MixedText";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/animate-ui/components/animate/tooltip";
import { HelpCircle } from "lucide-react";
import { UnifiedSettings } from "./settings/UnifiedSettings";

export function SettingsView({
    onExport, onImport, onClearLocalData,
    setRecords, setPlans, setKnowledge,  // Add setter functions
    activeTab,
    navMode,
    records = [],
    plans = [],
    knowledge = [],
    settings = {}
}: {
    onExport?: () => void;
    onImport?: () => void;
    onClearLocalData?: () => void;
    setRecords?: React.Dispatch<React.SetStateAction<RecordItem[]>>;  // Add setter types
    setPlans?: React.Dispatch<React.SetStateAction<StudyPlan[]>>;
    setKnowledge?: React.Dispatch<React.SetStateAction<KnowledgeItem[]>>;
    activeTab?: string;
    navMode?: string;
    records?: RecordItem[];
    plans?: StudyPlan[];
    knowledge?: KnowledgeItem[];
    settings?: UserSettings;
}) {
    // Render the unified settings component
    return (
        <UnifiedSettings
            onExport={onExport}
            onImport={onImport}
            onClearLocalData={onClearLocalData}
            setRecords={setRecords}  // Pass setter functions
            setPlans={setPlans}
            setKnowledge={setKnowledge}
            records={records}
            plans={plans}
            knowledge={knowledge}
            settings={settings}
            activeTab={activeTab}
            navMode={navMode}
        />
    );
}