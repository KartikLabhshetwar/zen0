import { useState, useCallback } from 'react'

interface ImagePersistenceOptions {
  maxSize?: number
  quality?: number
  maxWidth?: number
  maxHeight?: number
}

export function useImagePersistence(options: ImagePersistenceOptions = {}) {
  const [isProcessing, setIsProcessing] = useState(false)
  
  const {
    maxSize = 5 * 1024 * 1024,
    quality = 0.8,
    maxWidth = 1920,
    maxHeight = 1080
  } = options

  const compressImage = useCallback(async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        try {
          let { width, height } = img
          
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height)
            width *= ratio
            height *= ratio
          }
          
          canvas.width = width
          canvas.height = height
          
          ctx?.drawImage(img, 0, 0, width, height)
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now()
                })
                resolve(compressedFile)
              } else {
                reject(new Error('Failed to compress image'))
              }
            },
            file.type,
            quality
          )
        } catch (error) {
          reject(error)
        }
      }
      
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
  }, [maxWidth, maxHeight, quality])

  const processImageForStorage = useCallback(async (file: File): Promise<string> => {
    setIsProcessing(true)
    
    try {
      if (file.size > maxSize) {
        const compressedFile = await compressImage(file)
        return await fileToBase64(compressedFile)
      }
      
      return await fileToBase64(file)
    } catch (error) {
      console.error('Failed to process image:', error)
      throw error
    } finally {
      setIsProcessing(false)
    }
  }, [maxSize, compressImage])

  const fileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result)
        } else {
          reject(new Error('Failed to convert file to base64'))
        }
      }
      reader.onerror = error => reject(error)
    })
  }, [])

  const validateImage = useCallback((file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    return validTypes.includes(file.type) && file.size <= maxSize
  }, [maxSize])

  return {
    processImageForStorage,
    validateImage,
    isProcessing,
    compressImage
  }
}
