"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";

const pricingPlans = [
  {
    name: "Free",
    price: "0",
    currency: "€",
    period: "/mois",
    description: "Parfait pour commencer et tester la plateforme",
    features: [
      "100 messages par mois",
      "Jusqu'à 5 membres par équipe",
      "Conversations 1-à-1 illimitées",
      "5 pièces jointes (max 5 MB)",
      "Historique de 30 jours",
      "Support communautaire",
    ],
    cta: "Essayer Gratuitement",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "29",
    currency: "€",
    period: "/mois",
    description: "Pour les équipes qui veulent aller plus loin",
    features: [
      "Messages illimités",
      "Jusqu'à 50 membres par équipe",
      "Conversations de groupe illimitées",
      "Pièces jointes illimitées (max 100 MB)",
      "Historique complet",
      "Support prioritaire 24/7",
      "Intégrations avancées",
      "Statistiques et analytics",
      "API personnalisée",
    ],
    cta: "Essayer Maintenant",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Sur mesure",
    currency: "",
    period: "",
    description: "Solutions personnalisées pour grandes entreprises",
    features: [
      "Tout de Pro, plus :",
      "Membres illimités",
      "Serveur dédié",
      "SLA garanti 99.9%",
      "Formation sur mesure",
      "Account manager dédié",
      "Conformité RGPD avancée",
      "Single Sign-On (SSO)",
      "Audit de sécurité",
    ],
    cta: "Contactez-nous",
    highlighted: false,
  },
];

export function PricingSection() {
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
            Tarifs Transparents
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Choisissez le plan qui correspond à vos besoins. Changez ou annulez à tout moment.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-6">
          {pricingPlans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl p-8 transition-all duration-500 ${
                plan.highlighted
                  ? "bg-gradient-to-b from-blue-900/50 to-purple-900/50 border-2 border-blue-500 shadow-2xl shadow-blue-500/20 lg:scale-105"
                  : "bg-gray-800/50 border border-gray-700 hover:border-gray-600"
              } ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
              style={{
                transitionDelay: `${index * 150}ms`,
              }}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Plus Populaire
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  {plan.description}
                </p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl md:text-5xl font-bold text-white">
                    {plan.currency}{plan.price}
                  </span>
                  <span className="text-gray-400">
                    {plan.period}
                  </span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li
                    key={featureIndex}
                    className="flex items-start gap-3 text-gray-300"
                  >
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href="/auth/sign-up" className="block">
                <Button
                  className={`w-full ${
                    plan.highlighted
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                      : "bg-white text-black hover:bg-gray-200"
                  }`}
                  size="lg"
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-400">
            Toutes les formules incluent une période d&apos;essai de 14 jours. Aucune carte bancaire requise.
          </p>
        </div>
      </div>
    </section>
  );
}

