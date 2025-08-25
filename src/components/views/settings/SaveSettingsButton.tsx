import { Button } from "@/components/ui/button";
import { useNotification } from "@/components/magicui/NotificationProvider";
import React, { useRef } from "react";
import { MixedText } from "@/components/ui/MixedText";

interface SaveSettingsButtonProps {
    navMode: 'sidebar' | 'dock';
}

const SaveSettingsButton: React.FC<SaveSettingsButtonProps> = ({ navMode }) => {
    const { notify } = useNotification();
    const lastSavedNavMode = useRef(navMode);

    const handleSave = () => {
        if (lastSavedNavMode.current !== navMode) {
            notify({ type: "success", message: "设置已成功，请手动刷新页面" });
        } else {
            notify({ type: "success", message: "设置已保存" });
        }
        lastSavedNavMode.current = navMode;
    };

    return (
        <Button
            onClick={handleSave}
            size="default"
            className="h-8 sm:h-10 px-3 sm:px-6 text-xs sm:text-sm"
        >
            <MixedText text="保存所有设置" />
        </Button>
    );
};

export default SaveSettingsButton; 