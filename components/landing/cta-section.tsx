"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { motion } from "framer-motion"
import { Sparkles, ArrowRight } from "lucide-react"

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
  bgColor = "bg-gradient-to-br from-gray-900 via-black to-gray-800",
  textColor = "text-white"
}: CTASectionProps) {
  return (
    <section className={`relative min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 ${bgColor} ${textColor} overflow-hidden`}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-1/4 left-1/6 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"
          animate={{ 
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/6 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl"
          animate={{ 
            x: [0, -80, 0],
            y: [0, 30, 0],
            scale: [1, 0.8, 1]
          }}
          transition={{ 
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Floating Sparkles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 3) * 20}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 1, 0.3],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeInOut"
            }}
          >
            <Sparkles className="w-4 h-4 text-white/30" />
          </motion.div>
        ))}
      </div>

      <div className="relative text-center max-w-4xl z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.h2 
            className="text-5xl sm:text-7xl md:text-8xl font-light mb-8 sm:mb-12 font-space-grotesk"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            {title.split(' ').map((word, index) => (
              <motion.span
                key={index}
                className={index === 2 ? "bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent" : ""}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
              >
                {word}{' '}
              </motion.span>
            ))}
          </motion.h2>
        </motion.div>
        
        <motion.p 
          className="text-xl sm:text-2xl text-gray-300 mb-12 sm:mb-16 leading-relaxed font-space-grotesk font-light"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {description}
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="relative inline-block"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-25"
            whileHover={{ opacity: 0.4, scale: 1.05 }}
            transition={{ duration: 0.3 }}
          />
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <Button 
              asChild 
              size="lg"
              className="relative bg-white text-black hover:bg-gray-100 px-8 sm:px-12 py-6 sm:py-8 text-lg sm:text-xl font-medium rounded-2xl shadow-2xl hover:shadow-white/20 transition-all duration-300 group"
            >
              <Link href={buttonHref} className="flex items-center gap-3">
                {buttonText}
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
        
        {subtitle && (
          <motion.p 
            className="text-gray-400 text-sm sm:text-base mt-8 font-space-grotesk"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            {subtitle}
          </motion.p>
        )}
      </div>
      
      {/* Bottom Glow Effect */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full h-64 bg-gradient-to-t from-blue-600/10 to-transparent pointer-events-none" />
    </section>
  )
}
