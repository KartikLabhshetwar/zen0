"use client"

import { useState, useEffect } from "react"
import { BorderTrail } from "@/components/motion-primitives/border-trail"
import { Star, ExternalLink } from "lucide-react"
import { Button } from "./button"

export function GitHubStars() {
  const [stars, setStars] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStars() {
      try {
        const response = await fetch('https://api.github.com/repos/KartikLabhshetwar/zen0')
        const data = await response.json()
        setStars(data.stargazers_count)
      } catch (error) {
        console.error('Failed to fetch GitHub stars:', error)
        setStars(0)
      } finally {
        setLoading(false)
      }
    }

    fetchStars()
  }, [])

  const handleStarClick = () => {
    window.open('https://github.com/KartikLabhshetwar/zen0', '_blank')
  }

  return (
    <div className="relative">
      <Button
        onClick={handleStarClick}
        variant="outline"
        className="relative bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white/90 hover:border-gray-300 transition-all duration-300 group"
      >
        <Star className="w-4 h-4 mr-2 group-hover:fill-yellow-400 group-hover:text-yellow-400 transition-colors duration-300" />
        <span className="font-medium">
          {loading ? 'Star' : `${stars} Stars`}
        </span>
      </Button>
      <BorderTrail
        className="bg-gradient-to-l bg-blue-500"
        size={120}
      />
    </div>
  )
}
