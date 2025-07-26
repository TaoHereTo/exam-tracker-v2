import ReactBitsButton from "@/components/ui/ReactBitsButton";
import { useNotification } from "@/components/magicui/NotificationProvider";
import React, { useRef } from "react";

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
        <ReactBitsButton
            onClick={handleSave}
            size="sm"
            className="bg-gradient-to-br from-gray-800 to-black"
        >
            保存所有设置
        </ReactBitsButton>
    );
};

export default SaveSettingsButton; 