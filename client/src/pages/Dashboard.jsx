import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

// Mock data for now
const mockTools = [
  { id: 1, name: 'SSL Checker', description: 'Check SSL certificate validity and configuration', icon: '🔒', category: 'security', usageCount: 1234 },
  { id: 2, name: 'Port Scanner', description: 'Scan open ports on target systems', icon: '🔍', category: 'network', usageCount: 987 },
  { id: 3, name: 'Hash Generator', description: 'Generate various hash types for files and text', icon: '#️⃣', category: 'crypto', usageCount: 756 },
  { id: 4, name: 'Password Analyzer', description: 'Analyze password strength and security', icon: '🔐', category: 'security', usageCount: 2341 },
  { id: 5, name: 'URL Encoder', description: 'Encode and decode URLs safely', icon: '🔗', category: 'data', usageCount: 432 },
  { id: 6, name: 'Header Inspector', description: 'Inspect HTTP headers and security configurations', icon: '📋', category: 'network', usageCount: 567 }
]

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const filteredTools = mockTools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Audit Tools Dashboard</h1>
            <p className="text-xl text-gray-600 mb-8">
              Professional tools for security auditing and analysis
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search tools..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-12 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg
                  className="absolute left-4 top-3.5 h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap justify-center gap-2">
              {['all', 'security', 'network', 'crypto', 'data'].map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Tools Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredTools.map((tool) => (
              <motion.div
                key={tool.id}
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="card bg-white hover:shadow-xl"
              >
                <div className="p-6">
                  <div className="text-4xl mb-4">{tool.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{tool.name}</h3>
                  <p className="text-gray-600 mb-4">{tool.description}</p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-500">
                      {tool.usageCount.toLocaleString()} uses
                    </span>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                      {tool.category}
                    </span>
                  </div>
                  <button className="btn btn-primary w-full">
                    Launch Tool
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {filteredTools.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No tools found matching your criteria.</p>
            </div>
          )}
        </div>
      </section>

      {/* Recent Activity Section */}
      <section className="py-12 px-4 bg-white">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold mb-8">Recent Projects</h2>
          <div className="text-center py-8">
            <p className="text-gray-500">Your recent projects will appear here once you start using tools.</p>
            <Link to="/projects" className="btn btn-outline mt-4">
              View All Projects
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Dashboard