'use client'

import React, { useState, useEffect, useRef, useLayoutEffect, Children } from 'react'
import { motion, AnimatePresence, Variants } from 'motion/react'
import { Button } from './button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { UiverseSpinner } from './UiverseSpinner'

interface StepperProps {
  initialStep?: number
  onStepChange?: (step: number) => void
  onFinalStepCompleted?: () => void
  onBeforeNext?: (currentStep: number) => boolean | Promise<boolean>
  backButtonText?: string
  nextButtonText?: string
  isLoading?: boolean
  children: React.ReactNode
}

interface StepProps extends React.PropsWithChildren { }

export function Step({ children }: StepProps) {
  return <>{children}</>
}

export function Stepper({
  initialStep = 1,
  onStepChange,
  onFinalStepCompleted,
  onBeforeNext,
  backButtonText = '上一步',
  nextButtonText = '下一步',
  isLoading = false,
  children
}: StepperProps) {
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [direction, setDirection] = useState(0)
  const steps = Children.toArray(children).filter(
    (child) => React.isValidElement(child) && child.type === Step
  )
  const totalSteps = steps.length
  const isCompleted = currentStep > totalSteps
  const isLastStep = currentStep === totalSteps

  useEffect(() => {
    onStepChange?.(currentStep)
  }, [currentStep, onStepChange])

  const updateStep = (newStep: number) => {
    setCurrentStep(newStep)
    if (newStep > totalSteps) {
      onFinalStepCompleted?.()
    } else {
      onStepChange?.(newStep)
    }
  }

  const handleNext = async () => {
    if (!isLastStep) {
      // 如果有onBeforeNext回调，先执行验证
      if (onBeforeNext) {
        const canProceed = await onBeforeNext(currentStep)
        if (!canProceed) {
          return // 验证失败，不继续下一步
        }
      }
      setDirection(1)
      updateStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setDirection(-1)
      updateStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    // 最后一步也需要验证
    if (onBeforeNext) {
      const canProceed = await onBeforeNext(currentStep)
      if (!canProceed) {
        return // 验证失败，不完成
      }
    }
    setDirection(1)
    updateStep(totalSteps + 1)
  }

  const isFirstStep = currentStep === 1

  return (
    <div className="w-full relative z-[var(--z-focused)]">
      {/* Step indicators */}
      <div className="flex justify-center mb-8 relative z-[var(--z-sticky)]">
        <div className="flex items-center space-x-4">
          {steps.map((_, index) => {
            const stepNumber = index + 1
            const isNotLastStep = index < totalSteps - 1

            return (
              <React.Fragment key={stepNumber}>
                <StepIndicator
                  step={stepNumber}
                  currentStep={currentStep}
                  onClickStep={async (clicked) => {
                    // 如果点击非连续的下一步或后退前一步，允许直接跳转
                    // 只有点击前面步骤时才需要验证当前输入
                    if (clicked < currentStep) {
                      // 后退到前面的步骤，直接跳转
                      setDirection(-1)
                      updateStep(clicked)
                    } else if (clicked > currentStep) {
                      // 尝试前进到后面的步骤，需要验证
                      // 检查当前步骤到目标步骤之间的所有验证
                      for (let step = currentStep; step < clicked; step++) {
                        if (onBeforeNext) {
                          const canProceed = await onBeforeNext(step)
                          if (!canProceed) {
                            // 验证失败，不允许跳转
                            return
                          }
                        }
                      }
                      setDirection(1)
                      updateStep(clicked)
                    } else {
                      // 点击当前步骤，无需处理
                      return
                    }
                  }}
                />
                {isNotLastStep && (
                  <StepConnector isComplete={currentStep > stepNumber} />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* Current step content */}
      <StepContentWrapper
        isCompleted={isCompleted}
        currentStep={currentStep}
        direction={direction}
        className="mb-8 relative z-[var(--z-focused)]"
      >
        {steps[currentStep - 1]}
      </StepContentWrapper>

      {/* Navigation buttons */}
      {!isCompleted && (
        <div className="flex justify-between relative z-[var(--z-sticky)]">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={isFirstStep || isLoading}
            className="h-9 px-6 py-0 rounded-full font-medium flex items-center justify-center gap-2"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ChevronLeft className="w-4 h-4" />
            <span style={{ lineHeight: '1', display: 'inline-flex', alignItems: 'center', transform: 'translateY(1px)' }}>{backButtonText}</span>
          </Button>

          <Button
            type="button"
            onClick={isLastStep ? handleComplete : handleNext}
            disabled={isLoading}
            className="h-9 px-6 py-0 rounded-full font-medium bg-[#8b5cf6] text-white hover:bg-[#8b5cf6]/90 flex items-center justify-center gap-2"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <UiverseSpinner size={18} />
                <span style={{ lineHeight: '1', display: 'inline-flex', alignItems: 'center', transform: 'translateY(1px)' }}>验证中...</span>
              </div>
            ) : isLastStep ? (
              <span style={{ lineHeight: '1', display: 'inline-flex', alignItems: 'center', transform: 'translateY(1px)' }}>完成</span>
            ) : (
              <>
                <span style={{ lineHeight: '1', display: 'inline-flex', alignItems: 'center', transform: 'translateY(1px)' }}>{nextButtonText}</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

interface StepContentWrapperProps {
  isCompleted: boolean
  currentStep: number
  direction: number
  children: React.ReactNode
  className?: string
}

function StepContentWrapper({
  isCompleted,
  currentStep,
  direction,
  children,
  className = ''
}: StepContentWrapperProps) {
  const [parentHeight, setParentHeight] = useState(0)

  return (
    <motion.div
      style={{ position: 'relative', overflow: 'hidden' }}
      animate={{ height: isCompleted ? 0 : parentHeight }}
      transition={{ type: 'spring', duration: 0.4 }}
      className={className}
    >
      <AnimatePresence initial={false} mode="sync" custom={direction}>
        {!isCompleted && (
          <SlideTransition
            key={currentStep}
            direction={direction}
            onHeightReady={(h) => setParentHeight(h)}
          >
            {children}
          </SlideTransition>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

interface SlideTransitionProps {
  children: React.ReactNode;
  direction: number;
  onHeightReady: (height: number) => void;
}

function SlideTransition({ children, direction, onHeightReady }: SlideTransitionProps) {
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

interface StepIndicatorProps {
  step: number
  currentStep: number
  onClickStep: (clicked: number) => void
}

function StepIndicator({ step, currentStep, onClickStep }: StepIndicatorProps) {
  const status = currentStep === step ? 'active' : currentStep < step ? 'inactive' : 'complete'

  const handleClick = () => {
    if (step !== currentStep) {
      onClickStep(step)
    }
  }

  return (
    <motion.div
      onClick={handleClick}
      className="relative cursor-pointer outline-none focus:outline-none"
      animate={status}
      initial={false}
    >
      <motion.div
        variants={{
          inactive: {
            scale: 1,
            backgroundColor: '#e5e7eb',
            color: '#6b7280'
          },
          active: {
            scale: 1,
            backgroundColor: '#3b82f6',
            color: '#ffffff'
          },
          complete: {
            scale: 1,
            backgroundColor: '#10b981',
            color: '#ffffff'
          }
        }}
        transition={{ duration: 0.3 }}
        className="flex h-8 w-8 items-center justify-center rounded-full font-semibold text-sm dark:bg-gray-700 dark:text-gray-400"
      >
        {status === 'complete' ? (
          <CheckIcon className="h-4 w-4 text-white" />
        ) : status === 'active' ? (
          <div className="h-3 w-3 rounded-full bg-white" />
        ) : (
          <span>{step}</span>
        )}
      </motion.div>
    </motion.div>
  )
}

interface StepConnectorProps {
  isComplete: boolean
}

function StepConnector({ isComplete }: StepConnectorProps) {
  const lineVariants: Variants = {
    incomplete: { width: 0, backgroundColor: 'transparent' },
    complete: { width: '100%', backgroundColor: '#10b981' }
  }

  return (
    <div className="relative mx-2 h-0.5 flex-1 overflow-hidden rounded bg-gray-200 dark:bg-gray-700">
      <motion.div
        className="absolute left-0 top-0 h-full rounded-full"
        variants={lineVariants}
        initial={false}
        animate={isComplete ? 'complete' : 'incomplete'}
        transition={{ duration: 0.4, type: 'spring', stiffness: 300 }}
      />
    </div>
  )
}

interface CheckIconProps extends React.SVGProps<SVGSVGElement> { }

function CheckIcon(props: CheckIconProps) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <motion.path
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          delay: 0.1,
          type: 'tween',
          ease: 'easeOut',
          duration: 0.3
        }}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  )
}
