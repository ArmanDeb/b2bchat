# Test Local de la CI

Ce document explique comment tester localement que votre code passera la CI avant de push.

## Tests à exécuter

Exécutez ces commandes dans l'ordre pour simuler la CI localement :

### 1. Installer les dépendances
```bash
npm ci
```

### 2. Vérifier le linting
```bash
npm run lint
```

### 3. Vérifier les types TypeScript
```bash
npx tsc --noEmit
```

### 4. Builder le projet
```bash
npm run build
```

## Script rapide

Vous pouvez exécuter toutes ces commandes en une seule fois :

```bash
npm ci && npm run lint && npx tsc --noEmit && npm run build
```

Si toutes les commandes passent sans erreur, votre code devrait passer la CI sur GitHub! ✅

