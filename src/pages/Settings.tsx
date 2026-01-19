import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import Anthropic from '@anthropic-ai/sdk'

const ANTHROPIC_API_KEY_STORAGE_KEY = 'anthropic_api_key'

export default function Settings() {
  const { user, signOut } = useAuth()
  const [apiKey, setApiKey] = useState('')
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testMessage, setTestMessage] = useState('')

  useEffect(() => {
    const savedKey = localStorage.getItem(ANTHROPIC_API_KEY_STORAGE_KEY)
    if (savedKey) {
      setApiKey(savedKey)
    }
  }, [])

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem(ANTHROPIC_API_KEY_STORAGE_KEY, apiKey.trim())
      setTestMessage('API key saved successfully!')
      setTimeout(() => setTestMessage(''), 3000)
    } else {
      localStorage.removeItem(ANTHROPIC_API_KEY_STORAGE_KEY)
      setTestMessage('API key removed')
      setTimeout(() => setTestMessage(''), 3000)
    }
  }

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setTestMessage('Please enter an API key first')
      setTestStatus('error')
      return
    }

    setTestStatus('testing')
    setTestMessage('')

    try {
      const client = new Anthropic({
        apiKey: apiKey.trim(),
        dangerouslyAllowBrowser: true,
      })

      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: 'Test',
          },
        ],
      })

      if (response) {
        setTestStatus('success')
        setTestMessage('Connection successful!')
      }
    } catch (error: any) {
      setTestStatus('error')
      let errorMessage = 'Connection failed. Please check your API key.'
      
      if (error?.status === 401 || error?.message?.includes('invalid x-api-key') || error?.message?.includes('authentication_error')) {
        errorMessage = 'Invalid API key. Please check that your API key is correct and starts with "sk-ant-". You can get a new key from console.anthropic.com'
      } else if (error?.message) {
        errorMessage = error.message
      }
      
      setTestMessage(errorMessage)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-xl font-bold text-gray-900">
                Word Pilot
              </Link>
              <Link
                to="/"
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Home
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={signOut}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Configure your API keys and preferences</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Anthropic API Key</h2>
          <p className="text-sm text-gray-600 mb-4">
            Enter your Anthropic API key to enable the AI Writing Assistant. Get your key from{' '}
            <a
              href="https://console.anthropic.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700 underline"
            >
              console.anthropic.com
            </a>
          </p>

          <div className="space-y-4">
            <div>
              <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <input
                type="password"
                id="api-key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                Save
              </button>
              <button
                onClick={handleTestConnection}
                disabled={testStatus === 'testing'}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
              </button>
            </div>

            {(testMessage || testStatus !== 'idle') && (
              <div
                className={`p-3 rounded-md ${
                  testStatus === 'success'
                    ? 'bg-green-50 text-green-800'
                    : testStatus === 'error'
                    ? 'bg-red-50 text-red-800'
                    : 'bg-blue-50 text-blue-800'
                }`}
              >
                {testMessage}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
