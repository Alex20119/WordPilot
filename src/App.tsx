import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProjectProvider } from './contexts/ProjectContext'
import Landing from './pages/Landing'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import Subscribe from './pages/Subscribe'
import Success from './pages/Success'
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
          <Route path="/" element={<Landing />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/subscribe" element={<Subscribe />} />
          <Route path="/success" element={<Success />} />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <ProjectsList />
              </ProtectedRoute>
            }
          />
          {/* Legacy route redirect */}
          <Route path="/login" element={<Navigate to="/signin" replace />} />
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
