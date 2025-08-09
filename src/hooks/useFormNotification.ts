import { useNotification } from "@/components/magicui/NotificationProvider";

export function useFormNotification() {
    const { notify } = useNotification();

    const showError = (message = "请完善表单信息") => {
        notify({ type: "error", message });
    };

    const showSuccess = (message = "保存成功") => {
        notify({ type: "success", message });
    };

    const showWarning = (message: string, description?: string) => {
        notify({ type: "warning", message, description });
    };

    const showInfo = (message: string, description?: string) => {
        notify({ type: "info", message, description });
    };

    return { showError, showSuccess, showWarning, showInfo };
} 