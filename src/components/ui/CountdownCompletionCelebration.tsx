'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { MixedText } from '@/components/ui/MixedText';
import { Trophy, Sparkles, CheckCircle, ArrowRight, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useThemeMode } from '@/hooks/useThemeMode';

// Type definition for webkitAudioContext
interface WebkitAudioContext extends AudioContext {
  webkitAudioContext: typeof AudioContext;
}

interface CountdownCompletionCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  onViewCountdowns: () => void;
  countdownName: string;
}

export const CountdownCompletionCelebration: React.FC<CountdownCompletionCelebrationProps> = ({
  isOpen,
  onClose,
  onViewCountdowns,
  countdownName
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);
  const { isDarkMode } = useThemeMode();

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      setAnimationPhase(1);

      // 尝试播放庆祝音效（如果浏览器支持）
      try {
        // 创建一个简单的庆祝音效
        const AudioContextConstructor = window.AudioContext || (window as unknown as WebkitAudioContext).webkitAudioContext;
        const audioContext = new AudioContextConstructor();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      } catch (error) {
        // Audio not supported or blocked, silently fail
      }

      // 动画序列
      const timer1 = setTimeout(() => setAnimationPhase(2), 300);
      const timer2 = setTimeout(() => setAnimationPhase(3), 600);
      const timer3 = setTimeout(() => setAnimationPhase(4), 900);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    } else {
      setShowConfetti(false);
      setAnimationPhase(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 彩带动画 */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* 彩带 */}
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "absolute w-2 h-8 opacity-80 animate-confetti",
                i % 6 === 0 ? "bg-red-400" :
                  i % 6 === 1 ? "bg-blue-400" :
                    i % 6 === 2 ? "bg-green-400" :
                      i % 6 === 3 ? "bg-yellow-400" :
                        i % 6 === 4 ? "bg-purple-400" : "bg-pink-400"
              )}
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
                transform: `rotate(${Math.random() * 360}deg)`
              }}
            />
          ))}

          {/* 闪光效果 */}
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={`sparkle-${i}`}
              className="absolute animate-sparkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            >
              <Sparkles className="w-4 h-4 text-yellow-400" />
            </div>
          ))}
        </div>
      )}

      {/* 主弹窗 */}
      <div className={cn(
        "relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center transform transition-all duration-500",
        animationPhase >= 1 ? "scale-100 opacity-100" : "scale-75 opacity-0"
      )}>
        {/* 奖杯图标 */}
        <div className={cn(
          "mx-auto mb-6 w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center transform transition-all duration-700 animate-celebration-glow",
          animationPhase >= 2 ? "scale-100 rotate-0 animate-celebration-bounce" : "scale-0 rotate-180"
        )}>
          <Calendar className="w-10 h-10 text-white" />
        </div>

        {/* 标题 */}
        <div className={cn(
          "mb-4 transform transition-all duration-500 delay-300",
          animationPhase >= 3 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        )}>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-500" />
            <MixedText text="考试时间到！" />
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            <MixedText text={`考试"${countdownName}"已到达预定时间！`} />
          </p>
        </div>

        {/* 庆祝文字 */}
        <div className={cn(
          "mb-8 transform transition-all duration-500 delay-500",
          animationPhase >= 4 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        )}>
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-4">
            <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
              <MixedText text="🎉 祝贺！考试时间已到！" />
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
              <MixedText text="愿你在考试中取得优异成绩！" />
            </p>
          </div>
        </div>

        {/* 按钮组 */}
        <div className={cn(
          "flex flex-col sm:flex-row gap-3 transform transition-all duration-500 delay-700",
          animationPhase >= 4 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        )}>
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            <MixedText text="好的，我知道了" />
          </Button>
          <Button
            onClick={() => {
              onViewCountdowns();
              onClose();
            }}
            className="flex-1"
            variant={isDarkMode ? "default" : "default"}
          >
            <MixedText text="去查看" />
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};