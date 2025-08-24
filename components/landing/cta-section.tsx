import { Button } from "@/components/ui/button"
import Link from "next/link"

interface CTASectionProps {
  title: string
  description: string
  buttonText: string
  buttonHref: string
  subtitle?: string
  bgColor?: string
  textColor?: string
}

export function CTASection({ 
  title, 
  description, 
  buttonText, 
  buttonHref, 
  subtitle,
  bgColor = "bg-black",
  textColor = "text-white"
}: CTASectionProps) {
  return (
    <section className={`min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 ${bgColor} ${textColor}`}>
      <div className="text-center max-w-3xl">
        <h2 className="text-4xl sm:text-6xl md:text-7xl font-light mb-6 sm:mb-8">{title}</h2>
        <p className="text-lg sm:text-xl text-gray-300 mb-8 sm:mb-12 leading-relaxed">
          {description}
        </p>
        <Button asChild className="bg-white text-black hover:bg-gray-100 px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-medium rounded-lg">
          <Link href={buttonHref}>{buttonText}</Link>
        </Button>
        {subtitle && (
          <p className="text-gray-400 text-sm mt-6">{subtitle}</p>
        )}
      </div>
    </section>
  )
}
