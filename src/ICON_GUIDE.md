# 📱 NATIONAL FIT — App Icons Guide

## Normes Apple App Store & Google Play Store

### ✅ Tailles requises pour ton logo

**Pour les stores, tu dois créer 2 fichiers PNG :**

1. **`logo192.png`** — 192×192 pixels
   - Utilisé pour : Android, PWA, favicon haute résolution
   - Format : PNG avec ou sans transparence

2. **`logo512.png`** — 512×512 pixels  
   - Utilisé pour : Google Play Store featured, PWA
   - Format : PNG avec ou sans transparence

3. **`logo1024.png`** — 1024×1024 pixels (optionnel mais recommandé)
   - Utilisé pour : Apple App Store icon (obligatoire)
   - Format : PNG **SANS transparence**, coins arrondis automatiquement par Apple

---

### 🎨 Spécifications Apple App Store

- **Taille** : 1024×1024 pixels minimum
- **Format** : PNG ou JPEG
- **Fond** : **SANS transparence** (obligatoire)
- **Coins** : Ne pas arrondir (Apple le fait automatiquement)
- **Poids** : Max 5MB

**⚠️ Rejet fréquent** : Icônes avec transparence, floues, ou trop de texte

---

### 🎨 Spécifications Google Play Store

- **Icône** : 512×512 pixels, PNG, max 5MB
- **Featured graphic** : 1024×500 pixels, PNG ou JPEG
- **Fond** : Transparence autorisée
- **Coins** : Ne pas arrondir

---

### 📸 Screenshots requis

**Apple App Store (minimum 5) :**
- Taille : 1280×720 ou 1920×1080 (16:9)
- Format : PNG ou JPEG
- Doivent montrer l'app en fonctionnement

**Google Play Store (minimum 2) :**
- Taille : 320px - 3840px de large
- Ratio : 16:9 recommandé
- Format : PNG ou JPEG

---

### 🔧 Comment créer tes fichiers

**Option 1 — Base44 AI (recommandé) :**
1. Dashboard → Mobile app → "Generate with AI"
2. Décris ton logo : "Logo NATIONAL FIT, lettre N stylisée, bleu et rouge, fond blanc"
3. Télécharge en 1024×1024, 512×512, 192×192

**Option 2 — Outils gratuits :**
- **Canva** : Templates "App Icon" prêts
- **Figma** : Export en plusieurs tailles
- **Photopea** : Photoshop gratuit en ligne

**Option 3 — Conversion rapide :**
Si tu as déjà un logo SVG/PNG :
```bash
# Avec ImageMagick (gratuit)
convert logo.svg -resize 1024x1024 logo1024.png
convert logo.svg -resize 512x512 logo512.png
convert logo.svg -resize 192x192 logo192.png
```

---

### ✅ Checklist avant soumission

- [ ] `logo192.png` — 192×192 pixels
- [ ] `logo512.png` — 512×512 pixels  
- [ ] `logo1024.png` — 1024×1024 pixels (Apple, sans transparence)
- [ ] 5 screenshots Apple (1280×720)
- [ ] 2 screenshots Google (16:9)
- [ ] Featured graphic Google (1024×500) — optionnel mais recommandé

---

### 📁 Où placer les fichiers

Place tous les fichiers dans le dossier **`public/`** de ton projet Base44 :
```
public/
  ├── logo192.png
  ├── logo512.png
  └── logo1024.png (optionnel)
```

Puis mets à jour `manifest.json` et `index.html` (déjà fait ✅)