import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BenefitsSection } from "@/components/benefits-section";
import { PricingSection } from "@/components/pricing-section";
import { ArrowDown } from "lucide-react";

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
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 relative">
        <div className="text-center p-4 sm:p-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 sm:mb-8 md:mb-12 animate-fade-in">
            Welcome to B2B Chat
          </h1>
          
          <p className="text-xl sm:text-2xl text-gray-400 mb-8 sm:mb-12 max-w-2xl mx-auto animate-fade-in-delay">
            La plateforme de communication professionnelle qui transforme votre collaboration d&apos;équipe
          </p>
          
          <Link href="/auth/sign-up">
            <Button size="lg" className="bg-white text-black hover:bg-gray-200 text-base sm:text-lg px-6 py-3 sm:px-8 sm:py-4 w-full sm:w-auto animate-fade-in-delay-2">
              Essayer Maintenant
            </Button>
          </Link>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ArrowDown className="w-8 h-8 text-gray-400" />
        </div>
      </section>

      {/* Benefits Section */}
      <BenefitsSection />

      {/* Pricing Section */}
      <PricingSection />

      {/* Footer CTA */}
      <section className="py-20 px-4 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Prêt à Révolutionner Votre Communication ?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Rejoignez des centaines d&apos;entreprises qui font confiance à B2B Chat
          </p>
          <Link href="/auth/sign-up">
            <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-lg px-8 py-4">
              Commencer Gratuitement
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
