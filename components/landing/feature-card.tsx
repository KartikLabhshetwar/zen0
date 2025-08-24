import { ReactNode } from "react"

interface FeatureCardProps {
  icon: ReactNode
  title: string
  description: string
  iconBgColor: string
  iconColor: string
}

export function FeatureCard({ icon, title, description, iconBgColor, iconColor }: FeatureCardProps) {
  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-full ${iconBgColor} flex items-center justify-center mb-6`}>
        <div className={iconColor}>
          {icon}
        </div>
      </div>
      <h3 className="text-xl font-medium text-black mb-4">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}
