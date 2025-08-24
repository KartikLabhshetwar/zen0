import { StepCard } from "./step-card"

const steps = [
  {
    number: 1,
    title: "Get Your Groq API Key",
    description: "Sign up at Groq and get your free API key from the console."
  },
  {
    number: 2,
    title: "Configure & Chat",
    description: "Add your API key to zen0 and start experiencing ultra-fast responses."
  },
  {
    number: 3,
    title: "Enjoy the Speed",
    description: "Chat with any Groq model at unprecedented speeds, all stored securely in your browser."
  }
]

export function HowItWorksSection() {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-black mb-8 sm:mb-16 text-center">
          How It Works
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
          {steps.map((step) => (
            <StepCard key={step.number} {...step} />
          ))}
        </div>
      </div>
    </section>
  )
}
