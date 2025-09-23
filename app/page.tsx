import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
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
}
