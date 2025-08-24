interface StepCardProps {
  number: number
  title: string
  description: string
}

export function StepCard({ number, title, description }: StepCardProps) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
        <span className="text-2xl font-bold text-gray-700">{number}</span>
      </div>
      <h3 className="text-xl font-medium text-black mb-4">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}
