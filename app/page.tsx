import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    // If user is authenticated, redirect to the chat interface
    redirect("/protected");
  }

  // Show welcome page for non-authenticated users
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center p-8">
        <h1 className="text-6xl font-bold text-white mb-12">
          Welcome B2B Chat
        </h1>
        
        <Link href="/auth/login">
          <Button size="lg" className="bg-white text-black hover:bg-gray-200 text-lg px-8 py-4">
            Sign In / Sign Up
          </Button>
        </Link>
      </div>
    </div>
  );
}
