import { Button } from "@/components/ui/button"
import Link from "next/link"

export function HeroSection() {
  return (
    <section className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl text-center">
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-light tracking-tight text-black mb-6 sm:mb-8 animate-fade-in-up">
          zen0
        </h1>
        <p className="text-xl sm:text-2xl text-gray-600 max-w-2xl leading-relaxed mb-8 sm:mb-12 mx-auto animate-fade-in-up animation-delay-200">
          AI conversations with perfect memory and blazing fast responses. 
          Experience the world's fastest LLMs powered by Groq's inference technology and enhanced with Mem0 AI Memory.
        </p>
        <div className="animate-fade-in-up animation-delay-400">
          <Button
            asChild
            className="bg-black text-white hover:bg-gray-800 hover:scale-105 transition-all duration-300 px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-medium rounded-lg shadow-lg hover:shadow-xl"
          >
            <Link href="/chat">Start Chatting</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
