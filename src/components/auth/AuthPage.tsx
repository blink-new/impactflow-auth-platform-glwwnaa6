import { useState } from 'react'
import { LoginForm } from './LoginForm'
import { SignupForm } from './SignupForm'

interface AuthPageProps {
  onAuthSuccess: () => void
}

export function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ImpactFlow</h1>
          <p className="text-gray-600">Empowering NGOs to create lasting change</p>
        </div>

        {/* Auth Form */}
        {isLogin ? (
          <LoginForm
            onToggleMode={() => setIsLogin(false)}
            onSuccess={onAuthSuccess}
          />
        ) : (
          <SignupForm
            onToggleMode={() => setIsLogin(true)}
            onSuccess={onAuthSuccess}
          />
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2024 ImpactFlow. Making a difference together.</p>
        </div>
      </div>
    </div>
  )
}