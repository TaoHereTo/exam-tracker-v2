import toast from 'react-hot-toast';

/**
 * 统一的 Toast 通知管理 Hook
 * 提供标准化的通知方法
 */
export const useToast = () => {
    /**
     * 显示成功消息
     * @param message 消息内容
     * @param options 可选配置
     */
    const showSuccess = (message: string, options?: Parameters<typeof toast.success>[1]) => {
        return toast.success(message, options);
    };

    /**
     * 显示错误消息
     * @param message 消息内容
     * @param options 可选配置
     */
    const showError = (message: string, options?: Parameters<typeof toast.error>[1]) => {
        return toast.error(message, options);
    };

    /**
     * 显示加载消息
     * @param message 消息内容
     * @param options 可选配置
     */
    const showLoading = (message: string, options?: Parameters<typeof toast.loading>[1]) => {
        return toast.loading(message, options);
    };

    /**
     * 显示信息消息
     * @param message 消息内容
     * @param options 可选配置
     */
    const showInfo = (message: string, options?: Parameters<typeof toast>[1]) => {
        return toast(message, options);
    };

    /**
     * 显示自定义消息
     * @param message 消息内容
     * @param options 可选配置
     */
    const showCustom = (message: string, options?: Parameters<typeof toast>[1]) => {
        return toast(message, options);
    };

    /**
     * 关闭所有 toast
     */
    const dismissAll = () => {
        toast.dismiss();
    };

    /**
     * 关闭指定的 toast
     * @param toastId toast ID
     */
    const dismiss = (toastId: string) => {
        toast.dismiss(toastId);
    };

    return {
        showSuccess,
        showError,
        showLoading,
        showInfo,
        showCustom,
        dismissAll,
        dismiss,
    };
};
