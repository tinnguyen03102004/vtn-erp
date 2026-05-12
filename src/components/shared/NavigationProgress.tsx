'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Slim top progress bar shown during route transitions.
 * Inspired by NProgress but zero-dependency.
 */
export default function NavigationProgress() {
    const pathname = usePathname()
    const [progress, setProgress] = useState(0)
    const [visible, setVisible] = useState(false)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const prevPathRef = useRef(pathname)

    const start = useCallback(() => {
        setProgress(0)
        setVisible(true)
        timerRef.current = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) {
                    if (timerRef.current) clearInterval(timerRef.current)
                    return 90
                }
                // Fast at start, slow near end
                const increment = prev < 30 ? 8 : prev < 60 ? 4 : prev < 80 ? 2 : 0.5
                return Math.min(prev + increment, 90)
            })
        }, 100)
    }, [])

    const done = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current)
        setProgress(100)
        setTimeout(() => {
            setVisible(false)
            setProgress(0)
        }, 300)
    }, [])

    useEffect(() => {
        if (pathname !== prevPathRef.current) {
            done()
            prevPathRef.current = pathname
        }
    }, [pathname, done])

    // Intercept clicks on <a> tags to start the progress bar
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const anchor = (e.target as HTMLElement).closest('a')
            if (!anchor) return

            const href = anchor.getAttribute('href')
            if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) return
            if (anchor.target === '_blank') return
            if (e.metaKey || e.ctrlKey || e.shiftKey) return

            // Only start if navigating to a different page
            if (href !== window.location.pathname) {
                start()
            }
        }

        document.addEventListener('click', handleClick, true)
        return () => document.removeEventListener('click', handleClick, true)
    }, [start])

    if (!visible && progress === 0) return null

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                zIndex: 9999,
                pointerEvents: 'none',
            }}
        >
            <div
                style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, #C9A84C, #1F3A5F)',
                    borderRadius: '0 2px 2px 0',
                    width: `${progress}%`,
                    transition: progress === 100
                        ? 'width 0.2s ease, opacity 0.3s ease 0.1s'
                        : 'width 0.4s ease',
                    opacity: visible ? 1 : 0,
                    boxShadow: '0 0 8px rgba(201, 168, 76, 0.5)',
                }}
            />
        </div>
    )
}
