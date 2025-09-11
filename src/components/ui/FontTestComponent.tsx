import React from 'react';
import { MixedText } from './MixedText';

/**
 * Component for testing font rendering optimizations
 * This component displays text with various font properties to test clarity on high-DPI displays
 */
export function FontTestComponent() {
  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">字体渲染测试</h2>
      
      <div className="space-y-3">
        <div>
          <MixedText text="这是中文文本测试 - 应该清晰锐利" />
        </div>
        
        <div>
          <MixedText text="This is English text test - Should be crisp and clear" />
        </div>
        
        <div>
          <MixedText text="混合文本测试 Mixed text test - 中英文混合显示" />
        </div>
        
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
          <MixedText text="**加粗文本 Bold text** - 检查粗体渲染" />
        </div>
        
        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
          <MixedText text="*斜体文本 Italic text* - 检查斜体渲染" />
        </div>
        
        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
          <MixedText text="{red}红色文本 Red text{/red} - 检查彩色文本渲染" />
        </div>
      </div>
    </div>
  );
}