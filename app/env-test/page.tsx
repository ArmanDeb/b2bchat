'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function EnvTest() {
  const [testResult, setTestResult] = useState('')
  const [loading, setLoading] = useState(false)
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseKeyOld = process.env.SUPABASE_ANON_KEY
  
  const testSupabaseConnection = async () => {
    setLoading(true)
    setTestResult('Testing Supabase connection...\n')
    
    try {
      const supabase = createClient()
      setTestResult(prev => prev + '✅ Supabase client created successfully\n')
      
      // Test a simple query
      const { data, error } = await supabase.from('_dummy_table_').select('*').limit(1)
      
      if (error) {
        if (error.message.includes('relation "_dummy_table_" does not exist')) {
          setTestResult(prev => prev + '✅ Supabase connection working (table not found is expected)\n')
        } else {
          setTestResult(prev => prev + `❌ Supabase error: ${error.message}\n`)
        }
      } else {
        setTestResult(prev => prev + '✅ Supabase connection working\n')
      }
    } catch (err) {
      setTestResult(prev => prev + `❌ Exception: ${err}\n`)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Environment Variables Test</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="font-bold mb-2">Client-side Environment Variables:</h2>
          <p><strong>NEXT_PUBLIC_SUPABASE_URL:</strong> {supabaseUrl ? '✅ SET' : '❌ NOT SET'}</p>
          <p><strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong> {supabaseKey ? '✅ SET' : '❌ NOT SET'}</p>
          <p><strong>SUPABASE_ANON_KEY (old):</strong> {supabaseKeyOld ? '✅ SET' : '❌ NOT SET'}</p>
        </div>
        
        <div className="p-4 border rounded">
          <h2 className="font-bold mb-2">Supabase Connection Test:</h2>
          <button 
            onClick={testSupabaseConnection}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Supabase Connection'}
          </button>
          <pre className="text-xs bg-gray-100 p-2 rounded mt-2 whitespace-pre-wrap">
            {testResult || 'Click the button to test...'}
          </pre>
        </div>
        
        <div className="p-4 border rounded">
          <h2 className="font-bold mb-2">All Environment Variables:</h2>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
            {JSON.stringify(process.env, null, 2)}
          </pre>
        </div>
        
        <div className="p-4 border rounded bg-yellow-50">
          <h2 className="font-bold mb-2">Required Environment Variables:</h2>
          <p>Make sure you have these in Vercel:</p>
          <ul className="list-disc list-inside ml-4">
            <li><code>NEXT_PUBLIC_SUPABASE_URL</code> - Your Supabase project URL</li>
            <li><code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> - Your Supabase anon key</li>
          </ul>
          <p className="mt-2 text-sm text-red-600">
            Note: Both must have the <code>NEXT_PUBLIC_</code> prefix for client-side access!
          </p>
        </div>
      </div>
    </div>
  )
}
