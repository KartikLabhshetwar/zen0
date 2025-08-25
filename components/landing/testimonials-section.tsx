"use client"

import { motion } from "framer-motion"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Alex Chen",
    role: "AI Researcher",
    content: "zen0's speed is incredible! The Groq integration gives me access to cutting-edge models with sub-second responses. Perfect for rapid prototyping and research.",
    rating: 5,
    avatar: "AC"
  },
  {
    name: "Sarah Johnson",
    role: "Product Manager",
    content: "The Mem0 AI Memory feature is a game-changer. It remembers context across sessions, making every conversation more meaningful and productive.",
    rating: 5,
    avatar: "SJ"
  },
  {
    name: "Marcus Rodriguez",
    role: "Developer",
    content: "Privacy-first approach with local storage is exactly what I needed. Fast, secure, and the interface is beautifully designed. Highly recommended!",
    rating: 5,
    avatar: "MR"
  }
]

export function TestimonialsSection() {
  return (
    <section className="relative py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-1/4 left-1/8 w-64 h-64 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl"
          animate={{ 
            x: [0, 30, 0],
            y: [0, -20, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-1/3 right-1/8 w-80 h-80 bg-gradient-to-br from-green-200/20 to-blue-200/20 rounded-full blur-3xl"
          animate={{ 
            x: [0, -40, 0],
            y: [0, 25, 0],
            scale: [1, 0.9, 1]
          }}
          transition={{ 
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 sm:mb-20"
        >
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-light text-black mb-6 font-space-grotesk">
            Loved by <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-medium">thousands</span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto font-space-grotesk">
            Join the community of developers, researchers, and professionals who trust zen0 for their AI conversations
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ 
                duration: 0.6, 
                delay: index * 0.1,
                ease: "easeOut"
              }}
              whileHover={{ y: -8 }}
              className="group relative bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-lg border border-white/20 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300"
            >
              {/* Gradient Border Effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative">
                {/* Rating */}
                <div className="flex items-center gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                
                {/* Content */}
                <blockquote className="text-gray-700 text-lg leading-relaxed mb-6 font-space-grotesk">
                  "{testimonial.content}"
                </blockquote>
                
                {/* Author */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-black font-space-grotesk">{testimonial.name}</div>
                    <div className="text-gray-600 text-sm font-space-grotesk">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-20 sm:mt-24"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl sm:text-5xl font-bold text-gray-900 mb-2">5K+</div>
              <div className="text-gray-600 font-space-grotesk">Active Users</div>
            </div>
            <div>
              <div className="text-4xl sm:text-5xl font-bold text-gray-900 mb-2">50K+</div>
              <div className="text-gray-600 font-space-grotesk">Conversations</div>
            </div>
            <div>
              <div className="text-4xl sm:text-5xl font-bold text-gray-900 mb-2">99.9%</div>
              <div className="text-gray-600 font-space-grotesk">Uptime</div>
            </div>
            <div>
              <div className="text-4xl sm:text-5xl font-bold text-gray-900 mb-2">4.9</div>
              <div className="text-gray-600 font-space-grotesk">User Rating</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
