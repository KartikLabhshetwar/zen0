import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col justify-center items-center px-24">
        <div className="max-w-4xl text-center">
          <h1 className="text-8xl font-light tracking-tight text-black mb-8 animate-fade-in-up">zen0</h1>
          <p className="text-2xl text-gray-600 max-w-2xl leading-relaxed mb-12 mx-auto animate-fade-in-up animation-delay-200">
            AI conversations with perfect memory. Connect your preferred models and experience intelligent dialogue that
            remembers every detail.
          </p>
          <div className="animate-fade-in-up animation-delay-400">
            <Button
              asChild
              className="bg-black text-white hover:bg-gray-800 hover:scale-105 transition-all duration-300 px-8 py-6 text-lg font-medium rounded-lg shadow-lg hover:shadow-xl"
            >
              <Link href="/chat">Start Chatting</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="min-h-screen flex items-center px-24 bg-gray-50">
        <div className="w-full max-w-7xl mx-auto">
          <h2 className="text-5xl font-light text-black mb-16">Built for Intelligence</h2>

          <div className="grid grid-cols-3 gap-8 h-[600px]">
            {/* Large feature card */}
            <div className="col-span-2 bg-white p-12 flex flex-col justify-center">
              <h3 className="text-3xl font-medium text-black mb-6">Persistent Memory</h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                Every conversation builds upon the last. Our advanced memory system ensures context is never lost,
                creating truly intelligent dialogue that evolves with your needs.
              </p>
            </div>

            {/* Small feature card */}
            <div className="bg-black text-white p-8 flex flex-col justify-center">
              <h3 className="text-2xl font-medium mb-4">Multi-Provider</h3>
              <p className="text-gray-300 leading-relaxed">
                Bring your own API keys for OpenAI, Anthropic, Groq, and Gemini. Switch between models seamlessly.
              </p>
            </div>

            {/* Medium feature card */}
            <div className="bg-white p-10 flex flex-col justify-center">
              <h3 className="text-2xl font-medium text-black mb-4">Real-time Streaming</h3>
              <p className="text-gray-600 leading-relaxed">
                Server-sent events deliver responses instantly. No waiting, just fluid conversation.
              </p>
            </div>

            {/* Large feature card */}
            <div className="col-span-2 bg-gray-100 p-12 flex flex-col justify-center">
              <h3 className="text-3xl font-medium text-black mb-6">Complete History</h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                Access every conversation you've ever had. Search, reference, and continue discussions from any point in
                time with full context preservation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="min-h-screen flex flex-col justify-center items-center px-24 bg-black text-white">
        <div className="text-center max-w-3xl">
          <h2 className="text-7xl font-light mb-8">Ready to Begin?</h2>
          <p className="text-xl text-gray-300 mb-12 leading-relaxed">
            Start building meaningful dialogue with perfect memory. Just add your API keys and begin chatting.
          </p>
          <Button asChild className="bg-white text-black hover:bg-gray-100 px-8 py-6 text-lg font-medium">
            <Link href="/chat">Get Started</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12 px-24">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-light text-black">zen0</h3>
            <p className="text-gray-600 mt-2">AI conversations with memory</p>
          </div>
          <div className="text-gray-500 text-sm">© 2024 zen0. Built with intelligence.</div>
        </div>
      </footer>
    </div>
  )
}
