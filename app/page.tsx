import {
  HeroSection,
  FeaturesSection,
  TestimonialsSection,
  HowItWorksSection,
  CTASection,
  Footer
} from "@/components/landing"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <HeroSection />
      <FeaturesSection />
      <TestimonialsSection />
      <HowItWorksSection />
      <CTASection
        title="Ready for Blazing Speed?"
        description="Join thousands of users experiencing the fastest AI chat available. Just add your OpenRouter API key and start chatting with hundreds of AI models."
        buttonText="Get Started"
        buttonHref="/chat"
        subtitle="Free to use with your own OpenRouter API key. No credit card required."
      />
      <Footer />
    </div>
  )
}
