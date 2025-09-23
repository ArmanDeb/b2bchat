'use client'

export default function SimpleTest() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Simple Environment Test</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="font-bold mb-2">Environment Variables:</h2>
          <p><strong>NEXT_PUBLIC_SUPABASE_URL:</strong> {supabaseUrl ? '✅ SET' : '❌ NOT SET'}</p>
          <p><strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong> {supabaseKey ? '✅ SET' : '❌ NOT SET'}</p>
        </div>
        
        <div className="p-4 border rounded">
          <h2 className="font-bold mb-2">Values:</h2>
          <p><strong>URL:</strong> {supabaseUrl || 'NOT SET'}</p>
          <p><strong>KEY:</strong> {supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'NOT SET'}</p>
        </div>
        
        <div className="p-4 border rounded bg-yellow-50">
          <h2 className="font-bold mb-2">What This Means:</h2>
          <ul className="list-disc list-inside">
            <li>If both show ✅ SET → Environment variables are working</li>
            <li>If either shows ❌ NOT SET → You need to add the missing variable to Vercel</li>
            <li>If both show ✅ SET but login still doesn't work → The values might be incorrect</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

