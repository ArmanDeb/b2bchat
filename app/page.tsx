import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // If user is authenticated, redirect to the chat interface
      redirect("/protected");
    } else {
      // If user is not authenticated, redirect to login
      redirect("/auth/login");
    }
  } catch (error) {
    // If there's an error (likely missing env vars), redirect to login
    console.error("Error in home page:", error);
    redirect("/auth/login");
  }
}
