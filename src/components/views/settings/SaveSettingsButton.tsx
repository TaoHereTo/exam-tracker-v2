import { Button } from "@/components/ui/button";
import { useNotification } from "@/components/magicui/NotificationProvider";
import React from "react";
import { MixedText } from "@/components/ui/MixedText";
import { useThemeMode } from "@/hooks/useThemeMode";

const SaveSettingsButton: React.FC = () => {
    const { notify } = useNotification();
    const { isDarkMode } = useThemeMode();

    const handleSave = () => {
        notify({ type: "success", message: "设置已保存" });
    };

    return (
        <Button
            onClick={handleSave}
            size="default"
            className={`h-8 sm:h-10 px-3 sm:px-6 text-xs sm:text-sm ${
                isDarkMode 
                    ? 'bg-white text-black' 
                    : 'bg-black text-white'
            }`}
        >
            <MixedText text="保存所有设置" />
        </Button>
    );
};

export default SaveSettingsButton;