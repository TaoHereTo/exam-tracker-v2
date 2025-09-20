
'use client'

import React, { useRef, useLayoutEffect, useState } from 'react'
import { motion, AnimatePresence, Variants } from 'motion/react'

interface FormTransitionWrapperProps {
    children: React.ReactNode
    currentView: 'login' | 'signup' | 'forgot-password'
    className?: string
}

// 完全按照Stepper的动画变体实现 - 修正方向
const stepVariants: Variants = {
    enter: (dir: number) => ({
        x: dir >= 0 ? '-100%' : '100%',
        opacity: 0
    }),
    center: {
        x: '0%',
        opacity: 1
    },
    exit: (dir: number) => ({
        x: dir >= 0 ? '50%' : '-50%',
        opacity: 0
    })
}

// 获取视图索引，用于确定动画方向
const getViewIndex = (view: string) => {
    switch (view) {
        case 'login': return 0
        case 'signup': return 1
        case 'forgot-password': return 2
        default: return 0
    }
}

// SlideTransition组件，完全按照Stepper实现
function SlideTransition({ children, direction, onHeightReady }: {
    children: React.ReactNode;
    direction: number;
    onHeightReady: (height: number) => void;
}) {
    const containerRef = useRef<HTMLDivElement>(null)

    useLayoutEffect(() => {
        if (containerRef.current) {
            onHeightReady(containerRef.current.offsetHeight)
        }
    }, [children, onHeightReady])

    return (
        <motion.div
            ref={containerRef}
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4 }}
            style={{ position: 'absolute', left: 0, right: 0, top: 0 }}
        >
            {children}
        </motion.div>
    )
}

export function FormTransitionWrapper({
    children,
    currentView,
    className = ''
}: FormTransitionWrapperProps) {
    const [parentHeight, setParentHeight] = useState(0)
    const [direction, setDirection] = useState(0)
    const [animationKey, setAnimationKey] = useState(currentView)

    // 计算动画方向
    React.useEffect(() => {
        const previousIndex = getViewIndex(animationKey)
        const currentIndex = getViewIndex(currentView)
        setDirection(currentIndex - previousIndex)
        setAnimationKey(currentView)
    }, [currentView, animationKey])

    return (
        <motion.div
            style={{ position: 'relative', overflow: 'hidden' }}
            animate={{ height: parentHeight }}
            transition={{ type: 'spring', duration: 0.4 }}
            className={className}
        >
            <AnimatePresence initial={false} mode="sync" custom={direction}>
                <SlideTransition
                    key={animationKey}
                    direction={direction}
                    onHeightReady={(h) => setParentHeight(h)}
                >
                    {children}
                </SlideTransition>
            </AnimatePresence>
        </motion.div>
    )
}

export default FormTransitionWrapper
