import { Button } from "@/components/ui/button";
import { useNotification } from "@/components/magicui/NotificationProvider";
import React from "react";
import { MixedText } from "@/components/ui/MixedText";

const SaveSettingsButton: React.FC = () => {
    const { notify } = useNotification();

    const handleSave = () => {
        notify({ type: "success", message: "设置已保存" });
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