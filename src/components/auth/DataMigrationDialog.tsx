'use client'

import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Alert, AlertDescription } from '../ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { migrateAllData, clearLocalStorageData } from '../../lib/dataMigration'
import { useNotification } from '../magicui/NotificationProvider'
import { MigrationResult } from '../../types/common'
import { Database, Upload, Trash2, CheckCircle, AlertCircle } from 'lucide-react'
import { RainbowButton } from '../magicui/rainbow-button'
import { MixedText } from '../ui/MixedText'

interface DataMigrationDialogProps {
    isOpen: boolean
    onClose: () => void
}

export function DataMigrationDialog({ isOpen, onClose }: DataMigrationDialogProps) {
    const [isMigrating, setIsMigrating] = useState(false)
    const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null)
    const [showClearOption, setShowClearOption] = useState(false)
    const { notify } = useNotification()

    const handleMigration = async () => {
        setIsMigrating(true)
        setMigrationResult(null)

        try {
            const result = await migrateAllData()
            setMigrationResult(result)

            if (result.success) {
                notify({
                    message: "数据迁移成功",
                    description: `成功迁移了 ${result.totalMigrated} 条数据到云端`,
                    type: "success"
                })
                setShowClearOption(true)
            } else {
                notify({
                    message: "数据迁移失败",
                    description: "迁移过程中出现错误，请检查控制台获取详细信息",
                    type: "error"
                })
            }
        } catch (error) {
            console.error('Migration error:', error)
            notify({
                message: "数据迁移失败",
                description: "迁移过程中出现未知错误",
                type: "error"
            })
        } finally {
            setIsMigrating(false)
        }
    }

    const handleClearLocalStorage = () => {
        try {
            clearLocalStorageData()
            notify({
                message: "本地数据已清理",
                description: "localStorage中的数据已被清理，现在所有数据都存储在云端",
                type: "success"
            })
            onClose()
        } catch (error) {
            notify({
                message: "清理失败",
                description: "清理本地数据时出现错误",
                type: "error"
            })
        }
    }

    const getLocalStorageDataCount = () => {
        if (typeof window === 'undefined') return { records: 0, plans: 0, knowledge: 0 }

        try {
            const records = JSON.parse(localStorage.getItem('exam-tracker-records-v2') || '[]')
            const plans = JSON.parse(localStorage.getItem('exam-tracker-plans-v2') || '[]')
            const knowledge = JSON.parse(localStorage.getItem('exam-tracker-knowledge-v2') || '[]')

            return {
                records: records.length,
                plans: plans.length,
                knowledge: knowledge.length
            }
        } catch {
            return { records: 0, plans: 0, knowledge: 0 }
        }
    }

    const dataCount = getLocalStorageDataCount()
    const hasLocalData = dataCount.records > 0 || dataCount.plans > 0 || dataCount.knowledge > 0

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        <MixedText text="数据迁移" />
                    </DialogTitle>
                    <DialogDescription>
                        <MixedText text="将您的本地数据迁移到云端数据库，实现数据同步和备份" />
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {!migrationResult && hasLocalData && (
                        <Card className="bg-blue-50 border-blue-200">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm text-blue-800">
                                    <MixedText text="本地数据概览" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span><MixedText text="刷题记录：" /></span>
                                        <span className="font-medium"><MixedText text={`${dataCount.records} 条`} /></span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span><MixedText text="学习计划：" /></span>
                                        <span className="font-medium"><MixedText text={`${dataCount.plans} 个`} /></span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span><MixedText text="知识点：" /></span>
                                        <span className="font-medium"><MixedText text={`${dataCount.knowledge} 条`} /></span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {!hasLocalData && (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                <MixedText text="未检测到本地数据，无需迁移" />
                            </AlertDescription>
                        </Alert>
                    )}

                    {migrationResult && (
                        <Card className={migrationResult.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
                            <CardHeader className="pb-3">
                                <CardTitle className={`text-sm flex items-center gap-2 ${migrationResult.success ? 'text-green-800' : 'text-red-800'}`}>
                                    {migrationResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                    <span>
                                        <MixedText text={migrationResult.success ? '迁移完成' : '迁移失败'} />
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span><MixedText text="刷题记录：" /></span>
                                        <span className="font-medium"><MixedText text={`${migrationResult.results.records.count} 条`} /></span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span><MixedText text="学习计划：" /></span>
                                        <span className="font-medium"><MixedText text={`${migrationResult.results.plans.count} 个`} /></span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span><MixedText text="知识点：" /></span>
                                        <span className="font-medium"><MixedText text={`${migrationResult.results.knowledge.count} 条`} /></span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span><MixedText text="设置项：" /></span>
                                        <span className="font-medium"><MixedText text={`${migrationResult.results.settings.count} 项`} /></span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {showClearOption && (
                        <Alert>
                            <AlertDescription>
                                <MixedText text="数据已成功迁移到云端。您可以选择清理本地数据以节省存储空间。" />
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter className="flex gap-2">
                    {!migrationResult && hasLocalData && (
                        <RainbowButton
                            onClick={handleMigration}
                            disabled={isMigrating}
                            size="default"
                        >
                            {isMigrating ? (
                                <>
                                    <div className="mr-2">
                                        <LoadingSpinner size="sm" />
                                    </div>
                                    <MixedText text="迁移中..." />
                                </>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    <MixedText text="开始迁移" />
                                </>
                            )}
                        </RainbowButton>
                    )}

                    {showClearOption && (
                        <Button
                            onClick={handleClearLocalStorage}
                            variant="outline"
                            className="border-red-200 text-red-700 hover:bg-red-50"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            <MixedText text="清理本地数据" />
                        </Button>
                    )}

                    <Button variant="outline" onClick={onClose}>
                        <MixedText text="关闭" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
} 