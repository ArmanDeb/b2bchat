import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Home() {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // If user is authenticated, redirect to the chat interface
      redirect("/protected");
    }
  } catch (error) {
    console.error("Error in home page:", error);
  }

  // Show welcome page for non-authenticated users
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center p-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Welcome to B2BChat
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          Your professional communication platform
        </p>
        
        <div className="space-x-4">
          <Link href="/auth/login">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Sign In
            </Button>
          </Link>
          <Link href="/auth/sign-up">
            <Button variant="outline" size="lg">
              Sign Up
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
