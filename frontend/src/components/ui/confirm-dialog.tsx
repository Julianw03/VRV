import type React from 'react'
import {
    AlertDialogRoot,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from '@/components/ui/alert-dialog'

interface ConfirmDialogProps {
    title: string
    description: React.ReactNode
    onConfirm: () => void
    confirmLabel?: string
    children: React.ReactNode
}

export function ConfirmDialog({
    title,
    description,
    onConfirm,
    confirmLabel = 'Confirm',
    children,
}: ConfirmDialogProps) {
    return (
        <AlertDialogRoot>
            <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm}>{confirmLabel}</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialogRoot>
    )
}
