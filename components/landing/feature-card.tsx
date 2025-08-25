"use client"

import { ReactNode } from "react"
import { motion } from "framer-motion"

interface FeatureCardProps {
  icon: ReactNode
  title: string
  description: string
  iconBgColor: string
  iconColor: string
}

export function FeatureCard({ icon, title, description, iconBgColor, iconColor }: FeatureCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      whileHover={{ 
        y: -8,
        transition: { duration: 0.2, ease: "easeOut" }
      }}
      className="group relative bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-lg border border-white/20 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300"
    >
      {/* Gradient Border Effect */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Content */}
      <div className="relative">
        <motion.div 
          className={`w-14 h-14 rounded-2xl ${iconBgColor} flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300`}
          whileHover={{ 
            scale: 1.1,
            rotate: 5,
            transition: { duration: 0.2 }
          }}
        >
          <div className={`${iconColor} transform group-hover:scale-110 transition-transform duration-300`}>
            {icon}
          </div>
        </motion.div>
        
        <h3 className="text-xl sm:text-2xl font-semibold text-black mb-4 group-hover:text-gray-900 transition-colors duration-300 font-space-grotesk">
          {title}
        </h3>
        
        <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300 font-space-grotesk">
          {description}
        </p>
        
        {/* Hover Effect Arrow */}
        <motion.div 
          className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          initial={{ x: -10 }}
          whileHover={{ x: 0 }}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7V17" />
            </svg>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
