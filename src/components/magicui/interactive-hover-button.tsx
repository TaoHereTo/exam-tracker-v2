import React from "react";
import { ArrowRight, Edit, Download, Upload, Trash2, Plus, Eye, Settings, FileText, BarChart3, Calendar, Target, BookOpen, History, CheckCircle, XCircle, RefreshCw, Search, Filter, SortAsc, SortDesc, Star, Heart, Share2, Copy, Link, ExternalLink, Home, User, Bell, Mail, Phone, Camera, Video, Music, Image, File, Folder, Database, Cloud, Wifi, Battery, Lock, Unlock, Key, Shield, AlertCircle, Info, HelpCircle, ChevronRight, ChevronLeft, ChevronUp, ChevronDown, List, Grid3X3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface InteractiveHoverButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  // 继承所有HTML按钮属性
  hoverColor?: string; // 悬停时的背景颜色
  compact?: boolean; // 是否为紧凑模式（用于短文字按钮）
  icon?: React.ReactNode; // 悬停时显示的个性化图标
}

export const InteractiveHoverButton = React.forwardRef<
  HTMLButtonElement,
  InteractiveHoverButtonProps
>(({ children, className, style, hoverColor, compact = false, icon, ...props }, ref) => {
  // 从style中提取背景色作为悬停颜色
  const getHoverColor = () => {
    if (hoverColor) return hoverColor;
    if (style && typeof style === 'object' && 'background' in style) {
      return style.background as string;
    }
    return '#3B82F6'; // 默认蓝色
  };

  const hoverBgColor = getHoverColor();
  const isGradient = hoverBgColor.includes('gradient');

  // 根据按钮文本自动选择合适的图标
  const getAutoIcon = (text: string) => {
    const lowerText = text.toLowerCase();

    // 图片管理相关 - 需要放在最前面，避免被其他规则匹配
    if (lowerText.includes('图片管理') || lowerText.includes('image management')) {
      return <Settings className="w-4 h-4" />;
    }

    // 隐藏管理相关
    if (lowerText.includes('隐藏管理') || lowerText.includes('hide management')) {
      return <XCircle className="w-4 h-4" />;
    }

    // 列表/网格视图相关
    if (lowerText.includes('列表') || lowerText.includes('list')) {
      return <List className="w-4 h-4" />;
    }

    if (lowerText.includes('网格') || lowerText.includes('grid')) {
      return <Grid3X3 className="w-4 h-4" />;
    }

    // 编辑相关
    if (lowerText.includes('编辑') || lowerText.includes('修改') || lowerText.includes('edit')) {
      return <Edit className="w-4 h-4" />;
    }

    // 删除相关
    if (lowerText.includes('删除') || lowerText.includes('清空') || lowerText.includes('删除') || lowerText.includes('delete') || lowerText.includes('remove')) {
      return <Trash2 className="w-4 h-4" />;
    }

    // 导出相关
    if (lowerText.includes('导出') || lowerText.includes('下载') || lowerText.includes('export') || lowerText.includes('download')) {
      return <Upload className="w-4 h-4" />;
    }

    // 导入相关
    if (lowerText.includes('导入') || lowerText.includes('上传') || lowerText.includes('import') || lowerText.includes('upload')) {
      return <Download className="w-4 h-4" />;
    }

    // 新建/添加相关
    if (lowerText.includes('新建') || lowerText.includes('添加') || lowerText.includes('新增') || lowerText.includes('new') || lowerText.includes('add') || lowerText.includes('create')) {
      return <Plus className="w-4 h-4" />;
    }

    // 查看/预览相关
    if (lowerText.includes('查看') || lowerText.includes('预览') || lowerText.includes('view') || lowerText.includes('preview') || lowerText.includes('show')) {
      return <Eye className="w-4 h-4" />;
    }

    // 设置相关
    if (lowerText.includes('设置') || lowerText.includes('配置') || lowerText.includes('settings') || lowerText.includes('config')) {
      return <Settings className="w-4 h-4" />;
    }

    // 保存相关
    if (lowerText.includes('保存') || lowerText.includes('提交') || lowerText.includes('save') || lowerText.includes('submit')) {
      return <CheckCircle className="w-4 h-4" />;
    }

    // 取消相关
    if (lowerText.includes('取消') || lowerText.includes('cancel')) {
      return <XCircle className="w-4 h-4" />;
    }

    // 刷新/重新加载相关
    if (lowerText.includes('刷新') || lowerText.includes('重新') || lowerText.includes('refresh') || lowerText.includes('reload')) {
      return <RefreshCw className="w-4 h-4" />;
    }

    // 搜索相关
    if (lowerText.includes('搜索') || lowerText.includes('查找') || lowerText.includes('search') || lowerText.includes('find')) {
      return <Search className="w-4 h-4" />;
    }

    // 筛选/过滤相关
    if (lowerText.includes('筛选') || lowerText.includes('过滤') || lowerText.includes('filter')) {
      return <Filter className="w-4 h-4" />;
    }

    // 排序相关
    if (lowerText.includes('排序') || lowerText.includes('sort')) {
      return <SortAsc className="w-4 h-4" />;
    }

    // 计划相关
    if (lowerText.includes('计划') || lowerText.includes('plan')) {
      return <Target className="w-4 h-4" />;
    }

    // 历史相关
    if (lowerText.includes('历史') || lowerText.includes('history')) {
      return <History className="w-4 h-4" />;
    }

    // 知识点相关
    if (lowerText.includes('知识点') || lowerText.includes('知识') || lowerText.includes('knowledge')) {
      return <BookOpen className="w-4 h-4" />;
    }

    // 图表/分析相关
    if (lowerText.includes('图表') || lowerText.includes('分析') || lowerText.includes('chart') || lowerText.includes('analysis')) {
      return <BarChart3 className="w-4 h-4" />;
    }

    // 日历相关
    if (lowerText.includes('日历') || lowerText.includes('日期') || lowerText.includes('calendar') || lowerText.includes('date')) {
      return <Calendar className="w-4 h-4" />;
    }

    // 文件相关
    if (lowerText.includes('文件') || lowerText.includes('file')) {
      return <FileText className="w-4 h-4" />;
    }

    // 预测相关
    if (lowerText.includes('预测') || lowerText.includes('predict')) {
      return <BarChart3 className="w-4 h-4" />;
    }

    // 返回相关
    if (lowerText.includes('返回') || lowerText.includes('back') || lowerText.includes('return')) {
      return <ChevronLeft className="w-4 h-4" />;
    }

    // 前进相关
    if (lowerText.includes('前进') || lowerText.includes('next') || lowerText.includes('forward')) {
      return <ChevronRight className="w-4 h-4" />;
    }



    // 默认返回箭头
    return <ArrowRight className="w-4 h-4" />;
  };

  // 为渐变背景提供合适的纯色作为小圆点颜色
  const getDotColor = () => {
    if (isGradient) {
      // 从渐变中提取主要颜色
      if (hoverBgColor.includes('#374151') || hoverBgColor.includes('#111827')) {
        return '#374151'; // 深灰色
      }
      if (hoverBgColor.includes('#059669') || hoverBgColor.includes('#10b981')) {
        return '#059669'; // 绿色
      }
      if (hoverBgColor.includes('#EF4444')) {
        return '#EF4444'; // 红色
      }
      if (hoverBgColor.includes('#3B82F6')) {
        return '#3B82F6'; // 蓝色
      }
      if (hoverBgColor.includes('#D97706')) {
        return '#D97706'; // 橙色
      }
      // 默认返回渐变的第一个颜色
      return '#374151';
    }
    return hoverBgColor;
  };

  return (
    <button
      ref={ref}
      className={cn(
        `group relative w-auto ${compact ? 'min-w-[80px]' : 'min-w-[120px]'} cursor-pointer overflow-hidden rounded-sm border border-gray-200 bg-white p-2 px-3 text-center font-semibold text-black transition-all duration-300 hover:border-transparent active:scale-95 active:shadow-inner text-sm`,
        className,
      )}
      style={{
        ...style,
        background: 'white',
        color: 'black',
      }}
      {...props}
    >
      <div className="flex items-center justify-center gap-2">
        <div className="flex items-center justify-center w-4 h-4 transition-all duration-300 group-hover:scale-[100.8] group-hover:bg-white">
          <div
            className="w-2 h-2 rounded-full transition-colors duration-300"
            style={{ backgroundColor: getDotColor() }}
          ></div>
        </div>
        <span className="inline-block transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0 text-sm">
          {children}
        </span>
      </div>
      <div
        className="absolute top-0 left-0 z-10 flex h-full w-full translate-x-full items-center justify-center gap-1 text-white opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 px-3"
        style={isGradient ? { background: hoverBgColor } : { backgroundColor: hoverBgColor }}
      >
        <span className="text-sm">{children}</span>
        {icon || getAutoIcon(typeof children === 'string' ? children : '')}
      </div>
    </button>
  );
});

InteractiveHoverButton.displayName = "InteractiveHoverButton";
