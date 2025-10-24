# Diagrammes Mermaid pour B2BChat

Ce fichier contient les diagrammes Mermaid à intégrer dans Notion.

---

## 1. Schéma d'architecture (Front, Back, DB, Intégrations)

### Code Mermaid

```mermaid
graph TB
    subgraph "Client (Navigateur)"
        A[Interface Utilisateur]
        B[Next.js 15<br/>React 19<br/>TypeScript]
        C[Components<br/>shadcn/ui + Tailwind]
        D[Hooks personnalisés]
    end

    subgraph "Hosting & CI/CD"
        E[Vercel<br/>CDN Global]
        F[GitHub Actions<br/>CI Pipeline]
        G[GitHub Repository]
    end

    subgraph "Backend (Supabase)"
        H[Supabase Auth<br/>JWT + Sessions]
        I[Supabase Database<br/>PostgreSQL]
        J[Supabase Realtime<br/>WebSockets]
        K[Row Level Security<br/>RLS Policies]
    end

    subgraph "Base de données"
        L[(users)]
        M[(conversations)]
        N[(messages)]
        O[(conversation_participants)]
    end

    A --> B
    B --> C
    B --> D
    
    B -->|HTTPS REST API| H
    B -->|HTTPS REST API| I
    B -->|WebSocket| J
    
    E -->|Deploy| B
    G -->|Push| F
    F -->|Deploy| E
    
    H --> K
    I --> K
    K --> L
    K --> M
    K --> N
    K --> O
    
    J -->|Broadcast| L
    J -->|Broadcast| M
    J -->|Broadcast| N
    J -->|Broadcast| O

    style A fill:#3b82f6,color:#fff
    style B fill:#3b82f6,color:#fff
    style C fill:#3b82f6,color:#fff
    style D fill:#3b82f6,color:#fff
    style E fill:#10b981,color:#fff
    style F fill:#10b981,color:#fff
    style G fill:#10b981,color:#fff
    style H fill:#8b5cf6,color:#fff
    style I fill:#8b5cf6,color:#fff
    style J fill:#8b5cf6,color:#fff
    style K fill:#8b5cf6,color:#fff
    style L fill:#ef4444,color:#fff
    style M fill:#ef4444,color:#fff
    style N fill:#ef4444,color:#fff
    style O fill:#ef4444,color:#fff
```

### Version alternative (Architecture en couches)

```mermaid
flowchart TD
    subgraph Users["👥 Utilisateurs"]
        U1[Navigateur Web]
        U2[Mobile Browser]
    end

    subgraph Frontend["🎨 Frontend Layer"]
        F1[Next.js App Router]
        F2[React Components]
        F3[TypeScript]
        F4[Tailwind CSS + shadcn/ui]
    end

    subgraph Middleware["🔒 Middleware"]
        M1[Auth Middleware]
        M2[Route Protection]
    end

    subgraph Backend["⚙️ Backend Services (Supabase)"]
        B1[Authentication Service]
        B2[Database Service]
        B3[Realtime Service]
        B4[Storage Service]
    end

    subgraph Database["💾 Database Layer"]
        D1[(PostgreSQL)]
        D2[Row Level Security]
        D3[Triggers & Functions]
    end

    subgraph CICD["🚀 CI/CD"]
        C1[GitHub]
        C2[GitHub Actions]
        C3[Vercel]
    end

    U1 & U2 --> F1
    F1 --> F2
    F2 --> F3
    F3 --> F4
    F1 --> M1
    M1 --> M2
    M2 --> B1
    M2 --> B2
    M2 --> B3
    B1 --> D1
    B2 --> D1
    B3 --> D1
    D1 --> D2
    D2 --> D3
    C1 --> C2
    C2 --> C3
    C3 --> F1

    style Users fill:#e0e7ff
    style Frontend fill:#dbeafe
    style Middleware fill:#fef3c7
    style Backend fill:#ddd6fe
    style Database fill:#fecaca
    style CICD fill:#d1fae5
```

---

## 2. Diagramme UML de Classes (Données & Relations)

### Code Mermaid

```mermaid
classDiagram
    class AuthUsers {
        +UUID id PK
        +TEXT email
        +TEXT encrypted_password
        +TIMESTAMP created_at
        +authenticate()
        +resetPassword()
    }

    class Users {
        +UUID id PK FK
        +TEXT username UNIQUE
        +TEXT display_name
        +TEXT avatar_url
        +BOOLEAN is_online
        +TIMESTAMP last_seen
        +TIMESTAMP created_at
        +TIMESTAMP updated_at
        +updateProfile()
        +setOnlineStatus()
    }

    class Conversations {
        +UUID id PK
        +UUID participant1_id FK
        +UUID participant2_id FK
        +BOOLEAN is_group
        +TEXT name
        +UUID created_by FK
        +TIMESTAMP created_at
        +TIMESTAMP updated_at
        +getMessages()
        +getParticipants()
        +isOneOnOne()
    }

    class Messages {
        +UUID id PK
        +UUID conversation_id FK
        +UUID sender_id FK
        +TEXT content
        +TEXT message_type
        +BOOLEAN is_read
        +TIMESTAMP created_at
        +TIMESTAMP updated_at
        +markAsRead()
        +edit()
        +delete()
    }

    class ConversationParticipants {
        +UUID id PK
        +UUID conversation_id FK
        +UUID user_id FK
        +TIMESTAMP joined_at
        +TIMESTAMP left_at
        +BOOLEAN is_admin
        +BOOLEAN deleted_by_user
        +leave()
        +rejoin()
    }

    AuthUsers "1" --o "1" Users : creates profile via trigger
    Users "1" --o "0..*" Conversations : participant1_id
    Users "1" --o "0..*" Conversations : participant2_id
    Users "1" --o "0..*" Conversations : created_by
    Users "1" --o "0..*" Messages : sender_id
    Conversations "1" --o "0..*" Messages : contains
    Conversations "1" --o "0..*" ConversationParticipants : has members
    Users "1" --o "0..*" ConversationParticipants : participates in

    note for Users "RLS Policies:\n- SELECT: all users\n- UPDATE: own profile\n- INSERT: own profile"
    note for Conversations "Supports both:\n- One-on-one chats\n- Group conversations"
    note for Messages "Real-time broadcast\nvia Supabase Realtime"
    note for ConversationParticipants "Many-to-many relation\nfor group chats"
```

### Version alternative (avec détails RLS et fonctions)

```mermaid
classDiagram
    class Users {
        <<table>>
        +UUID id [PK]
        +TEXT username [UNIQUE]
        +TEXT display_name
        +TEXT avatar_url
        +BOOLEAN is_online
        +TIMESTAMP last_seen
        ---
        RLS: SELECT public
        RLS: UPDATE own only
        ---
        idx_users_username
        idx_users_online
    }

    class Conversations {
        <<table>>
        +UUID id [PK]
        +UUID participant1_id [FK]
        +UUID participant2_id [FK]
        +BOOLEAN is_group
        +TEXT name
        +UUID created_by [FK]
        ---
        CONSTRAINT: participant1 < participant2
        CONSTRAINT: UNIQUE (p1, p2)
        ---
        RLS: SELECT if participant
        RLS: INSERT if creator
        ---
        get_or_create_conversation()
        create_group_conversation()
    }

    class Messages {
        <<table>>
        +UUID id [PK]
        +UUID conversation_id [FK]
        +UUID sender_id [FK]
        +TEXT content
        +TEXT message_type [text|image|file]
        +BOOLEAN is_read
        +TIMESTAMP created_at
        ---
        RLS: SELECT if in conversation
        RLS: INSERT if participant
        RLS: UPDATE if sender
        ---
        idx_messages_conversation_id
        idx_messages_created_at
        ---
        mark_messages_as_read()
        get_unread_message_count()
    }

    class ConversationParticipants {
        <<table>>
        +UUID id [PK]
        +UUID conversation_id [FK]
        +UUID user_id [FK]
        +TIMESTAMP joined_at
        +TIMESTAMP left_at
        +BOOLEAN is_admin
        +BOOLEAN deleted_by_user
        ---
        CONSTRAINT: UNIQUE (conv, user)
        ---
        RLS: SELECT if member
        RLS: INSERT if admin
        RLS: UPDATE own only
        ---
        add_participant_to_group()
        leave_group_conversation()
        get_conversation_participants()
    }

    class AuthUsers {
        <<supabase.auth>>
        +UUID id [PK]
        +TEXT email
        +TEXT encrypted_password
        ---
        Trigger: on_auth_user_created
        Function: handle_new_user()
    }

    AuthUsers "1" --> "1" Users : auto-create profile
    Users "1" --> "0..*" Conversations : participant1
    Users "1" --> "0..*" Conversations : participant2
    Users "1" --> "0..*" Conversations : creator
    Users "1" --> "0..*" Messages : sender
    Conversations "1" --> "0..*" Messages : contains
    Conversations "1" --> "0..*" ConversationParticipants : has
    Users "0..*" --> "0..*" Conversations : via ConversationParticipants

    style Users fill:#3b82f6,color:#fff
    style Conversations fill:#8b5cf6,color:#fff
    style Messages fill:#10b981,color:#fff
    style ConversationParticipants fill:#f59e0b,color:#fff
    style AuthUsers fill:#ef4444,color:#fff
```

---

## 3. Diagramme de séquence : Envoi de message

```mermaid
sequenceDiagram
    actor User1 as Utilisateur 1
    participant UI as Interface React
    participant Hook as useRealtimeChat
    participant Supabase as Supabase Client
    participant DB as PostgreSQL
    participant Realtime as Realtime Server
    participant User2 as Utilisateur 2

    User1->>UI: Tape un message
    User1->>UI: Clique "Envoyer"
    UI->>Hook: handleSendMessage(content)
    Hook->>Supabase: insert({ conversation_id, sender_id, content })
    Supabase->>DB: INSERT INTO messages
    DB->>DB: Vérifie RLS policies
    DB->>DB: INSERT réussi
    DB-->>Supabase: Message créé (ID: 123)
    Supabase-->>Hook: { data: message, error: null }
    Hook-->>UI: Message ajouté localement
    UI-->>User1: Affiche le message

    DB->>Realtime: Trigger realtime event
    Realtime->>Realtime: Broadcast to channel
    Realtime-->>UI: WebSocket: new message
    Realtime-->>User2: WebSocket: new message
    UI->>UI: Auto-scroll + update
    User2->>User2: Voit le nouveau message
```

---

## 4. Flux d'authentification

```mermaid
stateDiagram-v2
    [*] --> NonAuthentifié
    NonAuthentifié --> PageLogin : Clique "Se connecter"
    PageLogin --> VerificationCredentials : Soumet formulaire
    VerificationCredentials --> Erreur : Credentials invalides
    Erreur --> PageLogin : Réessayer
    VerificationCredentials --> SessionCreee : Success
    SessionCreee --> MiddlewareCheck : Redirection
    MiddlewareCheck --> PageProtégée : Token valide
    PageProtégée --> InterfaceChat : Charge conversations
    InterfaceChat --> RealtimeConnected : Subscribe WebSocket
    RealtimeConnected --> [*] : Utilisateur actif
    
    PageProtégée --> SessionExpired : Token expiré
    SessionExpired --> NonAuthentifié : Logout automatique
    InterfaceChat --> Déconnexion : User logout
    Déconnexion --> NonAuthentifié : Clear session
```

---

## 5. Architecture de déploiement

```mermaid
graph LR
    subgraph Development["💻 Développement"]
        Dev[Developer]
        Local[Local Environment<br/>npm run dev]
    end

    subgraph Version_Control["📦 Version Control"]
        Git[Git Local]
        GitHub[GitHub Repository]
    end

    subgraph CI["✅ CI Pipeline"]
        Actions[GitHub Actions]
        Lint[ESLint]
        TypeCheck[TypeScript Check]
        Build[Build Test]
    end

    subgraph CD["🚀 CD Pipeline"]
        Vercel[Vercel Platform]
        Preview[Preview Deploy]
        Prod[Production Deploy]
    end

    subgraph Backend["⚡ Backend"]
        Supabase[Supabase Cloud]
        DB[(PostgreSQL)]
        RT[Realtime]
    end

    Dev --> Local
    Local --> Git
    Git --> GitHub
    GitHub --> Actions
    Actions --> Lint
    Lint --> TypeCheck
    TypeCheck --> Build
    Build --> Vercel
    Vercel --> Preview
    Preview --> Prod
    Prod --> Supabase
    Supabase --> DB
    Supabase --> RT

    style Development fill:#dbeafe
    style Version_Control fill:#fef3c7
    style CI fill:#bbf7d0
    style CD fill:#ddd6fe
    style Backend fill:#fecaca
```

---

## Comment utiliser ces diagrammes dans Notion

### Méthode 1 : Bloc Mermaid natif (si supporté)
1. Dans Notion, tapez `/mermaid`
2. Collez le code Mermaid
3. Le diagramme s'affichera automatiquement

### Méthode 2 : Générer une image
1. Allez sur [mermaid.live](https://mermaid.live)
2. Collez le code Mermaid
3. Téléchargez l'image générée (PNG/SVG)
4. Uploadez l'image dans Notion

### Méthode 3 : Intégration avec GitHub
1. Créez un fichier `.md` dans votre repo avec les diagrammes
2. GitHub affichera automatiquement les diagrammes Mermaid
3. Créez un lien dans Notion vers ce fichier GitHub

---

## Légende des couleurs

- 🔵 **Bleu** : Frontend / Client
- 🟢 **Vert** : CI/CD / Hosting
- 🟣 **Violet** : Backend / Supabase
- 🔴 **Rouge** : Base de données
- 🟡 **Jaune** : Middleware / Sécurité
- 🟠 **Orange** : Relations / Pivot tables

