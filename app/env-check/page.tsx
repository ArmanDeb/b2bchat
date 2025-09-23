export default function EnvCheck() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Environment Variables Check</h1>
      <div className="space-y-2">
        <p><strong>NEXT_PUBLIC_SUPABASE_URL:</strong> {supabaseUrl ? '✅ Set' : '❌ Missing'}</p>
        <p><strong>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY:</strong> {supabaseKey ? '✅ Set' : '❌ Missing'}</p>
      </div>
      {!supabaseUrl || !supabaseKey ? (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <h2 className="font-bold">Missing Environment Variables!</h2>
          <p>You need to set these in your Vercel dashboard:</p>
          <ul className="list-disc list-inside mt-2">
            <li>NEXT_PUBLIC_SUPABASE_URL</li>
            <li>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY</li>
          </ul>
        </div>
      ) : (
        <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          <p>✅ All environment variables are set!</p>
        </div>
      )}
    </div>
  );
}
