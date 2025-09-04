import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DataImportExport } from "@/components/features/DataImportExport";
import SaveSettingsButton from "./settings/SaveSettingsButton";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Download, Upload, Eye, Trash2, CloudUpload, CloudDownload } from "lucide-react";
import { useState } from "react";
import { CloudSyncService, UploadProgress } from "@/lib/cloudSyncService";
import { useNotification } from "@/components/magicui/NotificationProvider";
import { CloudDataOverview } from "./CloudDataOverview";
import { SyncReportItem } from "@/types/common";
import { RecordItem, StudyPlan, KnowledgeItem, UserSettings } from "@/types/record";
import { MixedText } from "@/components/ui/MixedText";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { UnifiedSettings } from "./settings/UnifiedSettings";

export function SettingsView({
    onExport, onImport, onClearLocalData,
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
            records={records}
            plans={plans}
            knowledge={knowledge}
            settings={settings}
            activeTab={activeTab}
            navMode={navMode}
        />
    );
}
