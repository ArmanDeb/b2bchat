# B2B Chat Application

<p align="center">
  <img alt="B2B Chat - Real-time messaging application" src="./app/opengraph-image.png">
  <h1 align="center">B2B Chat</h1>
</p>

<p align="center">
  Application de chat en temps réel pour entreprises avec authentification et gestion des conversations
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#demo"><strong>Demo</strong></a> ·
  <a href="#deploy-to-vercel"><strong>Deploy to Vercel</strong></a> ·
  <a href="#clone-and-run-locally"><strong>Clone and run locally</strong></a> ·
  <a href="#feedback-and-issues"><strong>Feedback and issues</strong></a>
  <a href="#more-supabase-examples"><strong>More Examples</strong></a>
</p>
<br/>

## Fonctionnalités

- **Chat en temps réel** avec Supabase Realtime
- **Authentification sécurisée** avec Supabase Auth
- **Gestion des conversations** (directes et de groupe)
- **Interface moderne** avec Tailwind CSS et shadcn/ui
- **Architecture Next.js 15** avec App Router
- **TypeScript** pour une meilleure sécurité de type
- **Déploiement facile** sur Vercel avec intégration Supabase

### Fonctionnalités du Chat

- ✅ Création de salles de chat personnalisées
- ✅ Rejoindre des salles existantes via Room ID
- ✅ Messages en temps réel
- ✅ Interface responsive
- ✅ Gestion des utilisateurs
- ✅ Chat direct et de groupe

## Installation et Configuration

### Prérequis

- Node.js 18+ 
- Compte Supabase
- Compte Vercel (pour le déploiement)

### Configuration de la base de données

1. **Créer un projet Supabase** sur [supabase.com](https://supabase.com)
2. **Exécuter les migrations** (voir `DATABASE_SETUP.md`)
3. **Activer Realtime** pour les tables `users`, `conversations`, `messages`

### Variables d'environnement

Créez un fichier `.env.local` avec :

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation locale

```bash
# Cloner le projet
git clone <votre-repo>
cd b2bchat

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
```

L'application sera disponible sur [http://localhost:3000](http://localhost:3000)

## Déploiement sur Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Connectez votre repository GitHub à Vercel
2. Configurez les variables d'environnement Supabase
3. Déployez automatiquement

## Structure du Projet

```
b2bchat/
├── app/                    # Pages Next.js (App Router)
│   ├── auth/              # Pages d'authentification
│   ├── protected/         # Pages protégées
│   └── page.tsx           # Page d'accueil
├── components/            # Composants React
│   ├── ui/               # Composants UI (shadcn/ui)
│   └── chat-interface.tsx # Interface de chat
├── hooks/                # Hooks personnalisés
├── lib/                  # Utilitaires et configuration
│   └── supabase/         # Configuration Supabase
├── supabase/             # Migrations de base de données
└── middleware.ts         # Middleware Next.js
```

## Technologies Utilisées

- **Next.js 15** - Framework React avec App Router
- **TypeScript** - Typage statique
- **Supabase** - Backend-as-a-Service (Auth + Database + Realtime)
- **Tailwind CSS** - Framework CSS
- **shadcn/ui** - Composants UI
- **Vercel** - Plateforme de déploiement

## Support

Pour toute question ou problème, consultez :
- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Next.js](https://nextjs.org/docs)
- [Issues GitHub](https://github.com/votre-repo/issues)
