import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useProject } from '@/contexts/ProjectContext'
import SandwichResearchDB from '@/components/SandwichResearchDB'
import { loadResearchItems, subscribeToResearchItems, ResearchItem } from '@/lib/researchItems'

interface ResearchDatabaseContentProps {
  embedded?: boolean
  enableTextSelection?: boolean
}

export default function ResearchDatabaseContent({ embedded = false, enableTextSelection = false }: ResearchDatabaseContentProps) {
  const { user } = useAuth()
  const { project, loading } = useProject()
  const { projectId } = useParams<{ projectId: string }>()
  const [searchTerm, setSearchTerm] = useState('')
  const [researchItems, setResearchItems] = useState<ResearchItem[]>([])
  const [loadingItems, setLoadingItems] = useState(true)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})

  // Load research items from Supabase
  useEffect(() => {
    if (!projectId) {
      setLoadingItems(false)
      return
    }

    const loadItems = async () => {
      setLoadingItems(true)
      const { data, error } = await loadResearchItems(projectId)
      if (error) {
        console.error('Error loading research items:', error)
      } else {
        setResearchItems(data || [])
      }
      setLoadingItems(false)
    }

    loadItems()

    // Subscribe to real-time updates
    const unsubscribe = subscribeToResearchItems(projectId, () => {
      loadItems()
    })

    return () => {
      unsubscribe()
    }
  }, [projectId])

  // Group items by section
  const groupedItems = researchItems.reduce((acc, item) => {
    if (!acc[item.section]) {
      acc[item.section] = []
    }
    acc[item.section].push(item)
    return acc
  }, {} as Record<string, ResearchItem[]>)

  // Filter items by search term
  const filteredGroupedItems = Object.entries(groupedItems).reduce((acc, [section, items]) => {
    const filtered = items.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
        Object.values(item.data || {}).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
    )
    if (filtered.length > 0) {
      acc[section] = filtered
    }
    return acc
  }, {} as Record<string, ResearchItem[]>)

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const toggleItem = (itemId: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }))
  }

  const exportToCSV = () => {
    if (researchItems.length === 0) {
      // Export empty CSV with headers for empty research database
      const headers = ['Section', 'Item Name', 'Research Data']
      const csvContent = [headers.join(',')].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${project?.title || 'research'}_database.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      return
    }

    // Export research items to CSV
    const headers = ['Section', 'Item Name', ...Object.keys(researchItems[0].data || {})]
    const rows = researchItems.map((item) => {
      const dataValues = Object.keys(researchItems[0].data || {}).map(
        (key) => `"${String(item.data?.[key] || '').replace(/"/g, '""')}"`
      )
      return [item.section, item.name, ...dataValues].join(',')
    })

    const csvContent = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project?.title || 'research'}_database.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Show loading state while project is loading
  if (loading || loadingItems) {
    return (
      <div className={`${embedded ? 'h-full' : 'min-h-screen'} bg-gray-50 flex items-center justify-center`}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  // Only show sandwich data for "Between the Slices" project for the specific user
  const shouldShowSandwichData = 
    project?.title === 'Between the Slices' && 
    user?.email === 'ahh201190@gmail.com'

  if (shouldShowSandwichData) {
    return <SandwichResearchDB embedded={embedded} enableTextSelection={enableTextSelection} />
  }

  // Empty state for all other projects with full top box
  return (
    <div className={embedded ? 'h-full' : 'w-full max-w-7xl mx-auto p-6 bg-gray-50'}>
      <div className={embedded ? 'p-6' : 'bg-white rounded-lg shadow-lg p-6 mb-6'}>
        {!embedded && (
          <>
            <h1 className="text-3xl font-bold text-primary-600 mb-2">{project?.title || 'Research Database'}: Research Database</h1>
            <p className="text-gray-600 mb-4">Comprehensive research for your project. Select text to add it to your writing with AI.</p>
          </>
        )}
        
        <div className={`flex items-center gap-4 mb-4 ${embedded ? 'flex-wrap' : ''}`}>
          <div className="flex-1 relative min-w-[200px]">
            <svg className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search elements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          {!embedded && projectId && (
            <Link
              to={`/project/${projectId}/research-tool`}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <span>AI Research Assistant</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
          
          {!embedded && (
          <button 
            onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            Export CSV
          </button>
          )}
        </div>
      </div>

      {researchItems.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center px-4">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No research items yet</h3>
            <p className="text-sm text-gray-600">
              Complete Phase 1 in the AI Research Assistant to create your research structure.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg p-6">
          {Object.keys(filteredGroupedItems).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No research items match your search.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(filteredGroupedItems).map(([section, items]) => (
                <div key={section} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection(section)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <span className="font-medium text-gray-900">{section}</span>
                    <svg
                      className={`w-5 h-5 text-gray-600 transition-transform ${
                        expandedSections[section] ? 'rotate-90' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                  {expandedSections[section] && (
                    <div className="p-4 bg-white border-t border-gray-200">
                      <div className="space-y-2">
                        {items.map((item) => {
                          const hasData = Object.keys(item.data || {}).length > 0
                          const isExpanded = expandedItems[item.id]

                          return (
                            <div key={item.id} className="border border-gray-200 rounded p-3">
                              <button
                                onClick={() => toggleItem(item.id)}
                                className="w-full flex items-center justify-between text-left"
                              >
                                <div className="flex items-center gap-2">
                                  <span className={hasData ? 'text-green-500' : 'text-gray-400'}>
                                    {hasData ? '✓' : '○'}
                                  </span>
                                  <span className="font-medium text-gray-900">{item.name}</span>
                                </div>
                                <svg
                                  className={`w-4 h-4 text-gray-600 transition-transform ${
                                    isExpanded ? 'rotate-90' : ''
                                  }`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                  />
                                </svg>
                              </button>
                              {isExpanded && (
                                <div className="mt-3 ml-6 space-y-3">
                                  {hasData ? (
                                    <>
                                      {/* Display regular fields (excluding sources) */}
                                      {Object.entries(item.data || {})
                                        .filter(([field]) => field !== 'sources')
                                        .map(([field, content]) => (
                                          <div key={field} className="border-l-2 border-primary-200 pl-3">
                                            <strong className="text-sm font-semibold text-gray-700 block mb-1">
                                              {field.replace(/_/g, ' ').toUpperCase()}
                                            </strong>
                                            <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                              {String(content)}
                                            </p>
                                          </div>
                                        ))}
                                      
                                      {/* Display sources separately */}
                                      {item.data?.sources && Array.isArray(item.data.sources) && item.data.sources.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-gray-300">
                                          <strong className="text-sm font-semibold text-gray-700 block mb-2">
                                            SOURCES:
                                          </strong>
                                          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                                            {item.data.sources.map((source: any) => (
                                              <li key={source.number || source.citation} className="ml-2">
                                                <span className="whitespace-pre-wrap">{source.citation || source}</span>
                                                {source.url && (
                                                  <span className="ml-2">
                                                    <a
                                                      href={source.url}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="text-primary-600 hover:text-primary-800 underline"
                                                      onClick={(e) => e.stopPropagation()}
                                                    >
                                                      [Link]
                                                    </a>
                                                  </span>
                                                )}
                                              </li>
                                            ))}
                                          </ol>
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <p className="text-sm text-gray-500 italic">
                                      Not researched yet
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
