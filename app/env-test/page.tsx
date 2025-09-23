'use client'

export default function EnvTest() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_ANON_KEY
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Environment Variables Test</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="font-bold mb-2">Client-side Environment Variables:</h2>
          <p><strong>NEXT_PUBLIC_SUPABASE_URL:</strong> {supabaseUrl || 'NOT SET'}</p>
          <p><strong>SUPABASE_ANON_KEY:</strong> {supabaseKey || 'NOT SET'}</p>
        </div>
        
        <div className="p-4 border rounded">
          <h2 className="font-bold mb-2">All Environment Variables:</h2>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(process.env, null, 2)}
          </pre>
        </div>
        
        <div className="p-4 border rounded">
          <h2 className="font-bold mb-2">Debug Info:</h2>
          <p>If you see "NOT SET" above, the environment variables are not being loaded properly.</p>
          <p>Make sure in Vercel you have:</p>
          <ul className="list-disc list-inside ml-4">
            <li>NEXT_PUBLIC_SUPABASE_URL (with NEXT_PUBLIC_ prefix)</li>
            <li>SUPABASE_ANON_KEY (without NEXT_PUBLIC_ prefix)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
