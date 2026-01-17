import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function Landing() {
  const { user, hasSubscription } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Redirect logged-in users with subscription to projects
  useEffect(() => {
    if (user && hasSubscription) {
      navigate('/projects', { replace: true })
    }
  }, [user, hasSubscription, navigate])

  // Smooth scroll to section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="w-full">
          <div className="relative flex items-center justify-between h-16">
            {/* Logo - Left */}
            <h1 className="text-2xl font-bold text-primary-600 pl-4 sm:pl-6 lg:pl-8">Word Pilot</h1>
            
            {/* Desktop Navigation - Centered */}
            <nav className="hidden md:flex items-center gap-6 absolute left-1/2 transform -translate-x-1/2">
              <button
                onClick={() => scrollToSection('about')}
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                About
              </button>
              <button
                onClick={() => scrollToSection('research')}
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Research
              </button>
              <button
                onClick={() => scrollToSection('writing')}
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Writing
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Pricing
              </button>
            </nav>

            {/* Auth Buttons - Right */}
            <div className="hidden md:flex items-center gap-4 pr-4 sm:pr-6 lg:pr-8">
              <Link
                to="/signin"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/subscribe"
                className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                Subscribe
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-4 pr-4 sm:pr-6 lg:pr-8">
              <Link
                to="/signin"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/subscribe"
                className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                Subscribe
              </Link>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                aria-label="Toggle menu"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {mobileMenuOpen ? (
                    <path d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <nav className="flex flex-col space-y-2">
                <button
                  onClick={() => scrollToSection('about')}
                  className="text-left text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  About
                </button>
                <button
                  onClick={() => scrollToSection('research')}
                  className="text-left text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Research
                </button>
                <button
                  onClick={() => scrollToSection('writing')}
                  className="text-left text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Writing
                </button>
                <button
                  onClick={() => scrollToSection('pricing')}
                  className="text-left text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Pricing
                </button>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">Word Pilot</h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8">
              AI research and writing assistant for non-fiction authors
            </p>
            <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
              Plan your research, conduct thorough investigations, and write your book with AI-powered assistance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/signup"
                className="bg-primary-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-primary-700 transition-colors"
              >
                Get Started
              </Link>
              <button
                onClick={() => scrollToSection('about')}
                className="bg-white text-primary-600 border-2 border-primary-600 px-8 py-3 rounded-lg text-lg font-medium hover:bg-primary-50 transition-colors"
              >
                Learn More
              </button>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">About Word Pilot</h2>
            <div className="space-y-6 text-lg text-gray-600">
              <p>
                Word Pilot is an AI-powered research and writing assistant designed specifically for non-fiction authors, 
                researchers, and academics who need to conduct thorough research and transform their findings into compelling written work.
              </p>
              <p>
                Whether you're writing a historical analysis, a scientific exploration, or an investigative piece, 
                Word Pilot helps you organize your research, verify sources, and weave your findings into a coherent narrative.
              </p>
              <div className="bg-primary-50 border-l-4 border-primary-600 p-6 rounded-r-lg mt-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Real-World Example</h3>
                <p className="text-gray-700">
                  One of our early users wrote "Between the Slices: A History of Sandwiches" using Word Pilot. 
                  The AI research assistant helped organize research on hundreds of sandwich varieties from around the world, 
                  verify historical claims, and structure the book into logical chapters. The result? A comprehensive, 
                  well-researched book that would have taken years to complete manually.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Research Section */}
        <section id="research" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">AI-Powered Research</h2>
            <div className="space-y-6 text-lg text-gray-600">
              <p>
                Word Pilot's research assistant uses Claude (Anthropic's advanced AI) to help you conduct thorough, 
                systematic research on any topic. Simply describe what you want to research, and Claude will:
              </p>
              <ul className="list-disc list-inside space-y-3 ml-4">
                <li>Help you plan your research structure and identify key topics to investigate</li>
                <li>Conduct in-depth research on each topic with complete source citations</li>
                <li>Organize findings in a searchable database with proper bibliographic references</li>
                <li>Verify facts and check for gaps or contradictions in your research</li>
              </ul>
              <div className="bg-white border border-gray-200 rounded-lg p-6 mt-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Complete Source Citations</h3>
                <p className="text-gray-700 mb-4">
                  Every piece of research includes full bibliographic details:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                  <li>Books: Author, year, title, publisher, ISBN</li>
                  <li>Websites: Article title, website name, URL, access date</li>
                  <li>Journal articles: Author, year, title, journal, volume, pages</li>
                </ul>
                <p className="text-gray-700 mt-4">
                  All sources are numbered and linked, making it easy to cite them in your writing.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Writing Section */}
        <section id="writing" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">Writing Assistance</h2>
            <div className="space-y-6 text-lg text-gray-600">
              <p>
                Transform your research into polished prose with Word Pilot's writing tools. The AI helps you 
                weave your research findings into compelling narratives while maintaining accuracy and proper attribution.
              </p>
              <div className="grid md:grid-cols-2 gap-6 mt-8">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Rich Text Editor</h3>
                  <p className="text-gray-700">
                    Write with a powerful rich text editor that supports formatting, lists, and structured content. 
                    Organize your book into sections and chapters with drag-and-drop reordering.
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Split-Screen Mode</h3>
                  <p className="text-gray-700">
                    View your research database and writing side-by-side. Select text from research items and 
                    add them directly to your draft with AI assistance.
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Export Options</h3>
                  <p className="text-gray-700">
                    Export your work as Microsoft Word (.docx) files with proper formatting, section titles, 
                    and optional table of contents. Your research citations are preserved for easy reference.
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Multi-Project Support</h3>
                  <p className="text-gray-700">
                    Manage multiple book projects simultaneously. Each project has its own research database 
                    and writing sections, keeping your work organized and accessible.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">Pricing</h2>
            <div className="text-center">
              <p className="text-lg text-gray-600 mb-8">
                Choose the plan that works for you. All plans include full access to research and writing features.
              </p>
              <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Subscription Plans</h3>
                <p className="text-gray-600 mb-6">
                  Pricing information coming soon. Contact us for early access or referral codes.
                </p>
                <Link
                  to="/subscribe"
                  className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-primary-700 transition-colors"
                >
                  View Pricing
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center text-gray-600">
          <p>&copy; 2026 Word Pilot. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
