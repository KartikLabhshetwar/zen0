import { FeatureCard } from "./feature-card"

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Blazing Fast Responses",
    description: "Powered by Groq's cutting-edge inference technology, zen0 delivers responses in milliseconds - up to 10x faster than traditional cloud APIs.",
    iconBgColor: "bg-blue-100",
    iconColor: "text-blue-600"
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: "Private & Secure",
    description: "All conversations are stored locally in your browser. No data is sent to our servers. Your API key never leaves your device.",
    iconBgColor: "bg-green-100",
    iconColor: "text-green-600"
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: "All Groq Models",
    description: "Access to all Llama, Mixtral, Gemma, and other cutting-edge models available through Groq with a single API key.",
    iconBgColor: "bg-purple-100",
    iconColor: "text-purple-600"
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    ),
    title: "Image & Context Support",
    description: "Upload images to extract text or use them as context for your conversations. Generate images with DALL-E when needed.",
    iconBgColor: "bg-yellow-100",
    iconColor: "text-yellow-600"
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
      </svg>
    ),
    title: "Mem0 AI Memory",
    description: "Powered by Mem0's advanced AI memory system, every conversation builds upon the last with intelligent context retrieval and persistent learning across sessions.",
    iconBgColor: "bg-red-100",
    iconColor: "text-red-600"
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    ),
    title: "Export & Import",
    description: "Easily backup and restore your conversations. Transfer your chat history between devices with our simple export/import feature.",
    iconBgColor: "bg-indigo-100",
    iconColor: "text-indigo-600"
  }
]

export function FeaturesSection() {
  return (
    <section className="min-h-screen flex items-center px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="w-full max-w-7xl mx-auto">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-black mb-8 sm:mb-16 text-center">
          Why zen0?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  )
}
