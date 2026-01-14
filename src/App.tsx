import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProjectProvider } from './contexts/ProjectContext'
import Login from './components/Login'
import ProtectedRoute from './components/ProtectedRoute'
import ProjectsList from './pages/ProjectsList'
import Home from './pages/Home'
import ResearchDatabase from './pages/ResearchDatabase'
import ResearchTool from './pages/ResearchTool'
import Writing from './pages/Writing'
import Settings from './pages/Settings'
import SplitScreen from './pages/SplitScreen'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ProjectsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/project/:projectId"
            element={
              <ProtectedRoute>
                <ProjectProvider>
                  <Home />
                </ProjectProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/project/:projectId/research"
            element={
              <ProtectedRoute>
                <ProjectProvider>
                  <ResearchDatabase />
                </ProjectProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/project/:projectId/research-tool"
            element={
              <ProtectedRoute>
                <ProjectProvider>
                  <ResearchTool />
                </ProjectProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/project/:projectId/writing"
            element={
              <ProtectedRoute>
                <ProjectProvider>
                  <Writing />
                </ProjectProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/project/:projectId/split"
            element={
              <ProtectedRoute>
                <ProjectProvider>
                  <SplitScreen />
                </ProjectProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
