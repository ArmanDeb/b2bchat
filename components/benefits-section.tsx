"use client";

import { MessageSquare, Users, Shield, Zap, Clock, Globe } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const benefits = [
  {
    icon: MessageSquare,
    title: "Communication en Temps Réel",
    description: "Échangez instantanément avec vos équipes et partenaires grâce à notre système de messagerie ultra-rapide.",
  },
  {
    icon: Users,
    title: "Conversations de Groupe",
    description: "Créez des groupes de discussion illimités pour une collaboration optimale entre équipes et départements.",
  },
  {
    icon: Shield,
    title: "Sécurité Renforcée",
    description: "Vos données sont protégées avec un chiffrement de bout en bout et une authentification sécurisée.",
  },
  {
    icon: Zap,
    title: "Performances Optimales",
    description: "Architecture moderne garantissant une expérience fluide même avec des milliers d'utilisateurs simultanés.",
  },
  {
    icon: Clock,
    title: "Historique Complet",
    description: "Accédez à l'historique complet de vos conversations avec une recherche rapide et efficace.",
  },
  {
    icon: Globe,
    title: "Accessible Partout",
    description: "Application web responsive accessible depuis n'importe quel appareil, à tout moment.",
  },
];

export function BenefitsSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = sectionRef.current;

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-20 px-4 bg-gradient-to-b from-black via-gray-900 to-black"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Pourquoi Choisir B2B Chat ?
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Une plateforme de communication professionnelle conçue pour propulser votre entreprise vers le succès
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={index}
                className={`group p-6 rounded-xl bg-gray-800/50 border border-gray-700 hover:border-gray-500 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20 ${
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-10"
                }`}
                style={{
                  transitionDelay: `${index * 100}ms`,
                }}
              >
                <div className="mb-4 p-3 bg-blue-500/10 rounded-lg w-fit group-hover:bg-blue-500/20 transition-colors">
                  <Icon className="w-8 h-8 text-blue-400 group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-400">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Animated screenshot/demo section */}
        <div className="mt-20">
          <div className="relative mx-auto max-w-5xl">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur-3xl opacity-20 animate-pulse"></div>
            <div className="relative bg-gray-800 rounded-2xl border border-gray-700 p-4 shadow-2xl">
              <div className="bg-gray-900 rounded-lg overflow-hidden">
                {/* Browser chrome mockup */}
                <div className="bg-gray-800 px-4 py-2 flex items-center gap-2 border-b border-gray-700">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="flex-1 text-center text-sm text-gray-400">
                    B2B Chat - Communication Professionnelle
                  </div>
                </div>
                
                {/* Animated chat preview */}
                <div className="p-8 space-y-4">
                  <div className="flex items-start gap-3 animate-fade-in-up">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex-shrink-0"></div>
                    <div className="bg-gray-700 rounded-2xl rounded-tl-none px-4 py-2 max-w-md">
                      <p className="text-white text-sm">Bonjour ! Comment puis-je vous aider aujourd&apos;hui ?</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 flex-row-reverse animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex-shrink-0"></div>
                    <div className="bg-blue-600 rounded-2xl rounded-tr-none px-4 py-2 max-w-md">
                      <p className="text-white text-sm">J&apos;aimerais en savoir plus sur vos solutions B2B</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex-shrink-0"></div>
                    <div className="bg-gray-700 rounded-2xl rounded-tl-none px-4 py-2 max-w-md">
                      <p className="text-white text-sm">Parfait ! Nos solutions offrent une communication sécurisée et performante pour votre entreprise.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

