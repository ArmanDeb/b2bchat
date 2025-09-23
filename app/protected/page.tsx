import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { OneOnOneChatInterface } from "@/components/one-on-one-chat-interface";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  // Get user email for username
  const username = data.claims.email?.split('@')[0] || 'User';

  return (
    <div className="h-screen w-full">
      <OneOnOneChatInterface username={username} />
    </div>
  );
}
