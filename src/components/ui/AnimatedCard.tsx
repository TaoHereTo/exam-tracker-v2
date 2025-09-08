import React, { useState, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

/**
 * AnimatedHeightProps defines the props for the AnimatedHeight component.
 */
interface AnimatedHeightProps {
  /**
   * The content to be rendered inside the component.
   * The component will animate its height to fit the content.
   */
  children: React.ReactNode;
  /**
   * The duration of the height change animation in seconds.
   * @default 0.4
   */
  duration?: number;
  /**
   * Optional className to be applied to the container element.
   */
  className?: string;
}

/**
 * A component that animates its height to match its children's height whenever the children change.
 * It uses framer-motion for smooth transitions.
 */
export const AnimatedHeight: React.FC<AnimatedHeightProps> = ({
  children,
  duration = 0.4,
  className,
}) => {
  const [height, setHeight] = useState<number | 'auto'>('auto');
  const contentRef = useRef<HTMLDivElement>(null);

  // useLayoutEffect runs synchronously after DOM mutations but before the browser paints.
  // This is crucial for getting the correct height of the new content before the animation starts,
  // preventing any visual flicker.
  useLayoutEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.offsetHeight);
    }
    // This effect should re-run whenever the children change, to measure the new height.
  }, [children]);

  return (
    <motion.div
      className={className}
      style={{ overflow: 'hidden' }}
      animate={{ height: height }}
      transition={{ duration, ease: "easeInOut" }}
    >
      {/* We use a ref on the immediate child wrapper of the content.
        This allows us to measure the natural height of the content block.
      */}
      <div ref={contentRef}>
        {children}
      </div>
    </motion.div>
  );
};
