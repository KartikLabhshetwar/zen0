import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
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

      {/* Features Section */}
      <section className="min-h-screen flex items-center px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="w-full max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-black mb-8 sm:mb-16 text-center">Why zen0?</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Feature card */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-black mb-4">Blazing Fast Responses</h3>
              <p className="text-gray-600 leading-relaxed">
                Powered by Groq's cutting-edge inference technology, zen0 delivers responses in milliseconds - up to 10x faster than traditional cloud APIs.
              </p>
            </div>

            {/* Feature card */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-black mb-4">Private & Secure</h3>
              <p className="text-gray-600 leading-relaxed">
                All conversations are stored locally in your browser. No data is sent to our servers. Your API key never leaves your device.
              </p>
            </div>

            {/* Feature card */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-black mb-4">All Groq Models</h3>
              <p className="text-gray-600 leading-relaxed">
                Access to all Llama, Mixtral, Gemma, and other cutting-edge models available through Groq with a single API key.
              </p>
            </div>

            {/* Feature card */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-black mb-4">Image & Context Support</h3>
              <p className="text-gray-600 leading-relaxed">
                Upload images to extract text or use them as context for your conversations. Generate images with DALL-E when needed.
              </p>
            </div>

            {/* Feature card */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-black mb-4">Mem0 AI Memory</h3>
              <p className="text-gray-600 leading-relaxed">
                Powered by Mem0's advanced AI memory system, every conversation builds upon the last with intelligent context retrieval and persistent learning across sessions.
              </p>
            </div>

            {/* Feature card */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-black mb-4">Export & Import</h3>
              <p className="text-gray-600 leading-relaxed">
                Easily backup and restore your conversations. Transfer your chat history between devices with our simple export/import feature.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-black mb-8 sm:mb-16 text-center">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-gray-700">1</span>
              </div>
              <h3 className="text-xl font-medium text-black mb-4">Get Your Groq API Key</h3>
              <p className="text-gray-600">
                Sign up at Groq and get your free API key from the console.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-gray-700">2</span>
              </div>
              <h3 className="text-xl font-medium text-black mb-4">Configure & Chat</h3>
              <p className="text-gray-600">
                Add your API key to zen0 and start experiencing ultra-fast responses.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-gray-700">3</span>
              </div>
              <h3 className="text-xl font-medium text-black mb-4">Enjoy the Speed</h3>
              <p className="text-gray-600">
                Chat with any Groq model at unprecedented speeds, all stored securely in your browser.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 bg-black text-white">
        <div className="text-center max-w-3xl">
          <h2 className="text-4xl sm:text-6xl md:text-7xl font-light mb-6 sm:mb-8">Ready for Blazing Speed?</h2>
          <p className="text-lg sm:text-xl text-gray-300 mb-8 sm:mb-12 leading-relaxed">
            Join thousands of users experiencing the fastest AI chat available. 
            Just add your Groq API key and start chatting in milliseconds.
          </p>
          <Button asChild className="bg-white text-black hover:bg-gray-100 px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-medium rounded-lg">
            <Link href="/chat">Get Started</Link>
          </Button>
          <p className="text-gray-400 text-sm mt-6">
            Free to use with your own Groq API key. No credit card required.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="text-center sm:text-left">
            <h3 className="text-2xl font-light text-black">zen0</h3>
            <p className="text-gray-600 mt-2">AI conversations with blazing fast responses</p>
          </div>
          <div className="text-gray-500 text-sm text-center">
            © {new Date().getFullYear()} zen0. Built for speed.
          </div>
        </div>
      </footer>
    </div>
  )
}