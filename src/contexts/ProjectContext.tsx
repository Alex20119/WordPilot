import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { Project } from '@/types/database.types'
import { getProjectById } from '@/lib/projects'

interface ProjectContextType {
  project: Project | null
  projectId: string | undefined
  loading: boolean
  error: string | null
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { projectId } = useParams<{ projectId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId || !user) {
      setLoading(false)
      return
    }

    const loadProject = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getProjectById(projectId)
        setProject(data)
      } catch (err: any) {
        console.error('Error loading project:', err)
        setError(err.message || 'Failed to load project')
        // Redirect to projects list if project not found
        navigate('/')
      } finally {
        setLoading(false)
      }
    }

    loadProject()
  }, [projectId, user, navigate])

  return (
    <ProjectContext.Provider value={{ project, projectId, loading, error }}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject() {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider')
  }
  return context
}
