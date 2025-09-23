'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export default function DebugPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const testLogin = async () => {
    setLoading(true)
    setResult('Testing login...')
    
    try {
      const supabase = createClient()
      
      // Test if Supabase client is working
      setResult('Supabase client created successfully\n')
      
      // Test login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        setResult(prev => prev + `Login error: ${error.message}\n`)
      } else {
        setResult(prev => prev + `Login successful! User: ${data.user?.email}\n`)
      }
    } catch (err) {
      setResult(prev => prev + `Exception: ${err}\n`)
    } finally {
      setLoading(false)
    }
  }

  const testSignUp = async () => {
    setLoading(true)
    setResult('Testing signup...')
    
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (error) {
        setResult(prev => prev + `Signup error: ${error.message}\n`)
      } else {
        setResult(prev => prev + `Signup successful! Check your email for confirmation.\n`)
      }
    } catch (err) {
      setResult(prev => prev + `Exception: ${err}\n`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Debug Login</h1>
      
      <Card className="p-4 mb-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="test@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password123"
            />
          </div>
          
          <div className="flex gap-2">
            <Button onClick={testLogin} disabled={loading || !email || !password}>
              Test Login
            </Button>
            <Button onClick={testSignUp} disabled={loading || !email || !password}>
              Test Signup
            </Button>
          </div>
        </div>
      </Card>
      
      <Card className="p-4">
        <h3 className="font-medium mb-2">Result:</h3>
        <pre className="text-sm bg-gray-100 p-2 rounded whitespace-pre-wrap">
          {result || 'Click a button to test...'}
        </pre>
      </Card>
    </div>
  )
}
