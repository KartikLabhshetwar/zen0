import { useState, useEffect, useCallback } from 'react'

interface UseMobileKeyboardReturn {
  isKeyboardOpen: boolean
  keyboardHeight: number
  inputBottom: number
}

export function useMobileKeyboard(): UseMobileKeyboardReturn {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [inputBottom, setInputBottom] = useState(0)

  const handleResize = useCallback(() => {
    if (typeof window === 'undefined') return

    const viewportHeight = window.innerHeight
    const documentHeight = document.documentElement.clientHeight
    const heightDifference = viewportHeight - documentHeight

    // On mobile, when keyboard opens, the viewport height decreases
    if (heightDifference > 150) {
      setIsKeyboardOpen(true)
      setKeyboardHeight(heightDifference)
      setInputBottom(heightDifference)
    } else {
      setIsKeyboardOpen(false)
      setKeyboardHeight(0)
      setInputBottom(0)
    }
  }, [])

  const handleVisualViewportChange = useCallback(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return

    const viewport = window.visualViewport
    const heightDifference = window.innerHeight - viewport.height

    if (heightDifference > 150) {
      setIsKeyboardOpen(true)
      setKeyboardHeight(heightDifference)
      setInputBottom(heightDifference)
    } else {
      setIsKeyboardOpen(false)
      setKeyboardHeight(0)
      setInputBottom(0)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Use visualViewport API if available (more reliable on mobile)
    if (window.visualViewport) {
      const viewport = window.visualViewport
      viewport.addEventListener('resize', handleVisualViewportChange)
      return () => {
        viewport.removeEventListener('resize', handleVisualViewportChange)
      }
    } else {
      // Fallback to window resize
      window.addEventListener('resize', handleResize)
      return () => {
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [handleResize, handleVisualViewportChange])

  return {
    isKeyboardOpen,
    keyboardHeight,
    inputBottom
  }
}
