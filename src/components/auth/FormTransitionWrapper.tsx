
'use client'

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { motion, AnimatePresence, Variants } from 'motion/react'

interface FormTransitionWrapperProps {
    children: React.ReactNode
    currentPath: string
    className?: string
}

// 直接来自Stepper的stepVariants
const stepVariants: Variants = {
    enter: (dir: number) => ({
        x: dir >= 0 ? '100%' : '-100%',
        opacity: 0
    }),
    center: {
        x: '0%',
        opacity: 1
    },
    exit: (dir: number) => ({
        x: dir >= 0 ? '-50%' : '50%',
        opacity: 0
    })
}

// 高度适应的SlideTransition组件，直接从Stepper复制
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
    currentPath,
    className = ''
}: FormTransitionWrapperProps) {
    const [animationKey, setAnimationKey] = useState(currentPath)
    const [direction, setDirection] = useState(0)
    const [parentHeight, setParentHeight] = useState(0)

    // 定义路径对应的步骤索引，用于确定动画方向
    const getPathIndex = (path: string) => {
        switch (path) {
            case '/auth/login':
                return 0
            case '/auth/signup':
                return 1
            case '/auth/forgot-password':
                return 2
            default:
                return 0
        }
    }

    useEffect(() => {
        const previousIndex = getPathIndex(animationKey)
        const currentIndex = getPathIndex(currentPath)

        // 将索引差值传递给direction (Stepper使用dir >= 0的逻辑)
        setDirection(currentIndex - previousIndex)
        setAnimationKey(currentPath)
    }, [currentPath, animationKey])

    // StepContentWrapper逻辑，从Stepper直接复制
    return (
        <motion.div
            style={{ position: 'relative', overflow: 'visible' }}
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
