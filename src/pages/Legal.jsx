import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, FileText, Info } from 'lucide-react';

const TABS = [
  { id: 'cgu', label: 'CGU', icon: FileText },
  { id: 'privacy', label: 'Confidentialité', icon: Shield },
  { id: 'mentions', label: 'Mentions légales', icon: Info },
];

const CGU = () => (
  <div className="space-y-5 text-sm text-slate-700 leading-relaxed">
    <section>
      <h2 className="font-bold text-base text-slate-900 mb-2">1. Objet</h2>
      <p>Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de l'application mobile et web <strong>NATIONAL FIT</strong> (ci-après « l'Application »), éditée par Brochier Bastien (ci-après « l'Éditeur »). En utilisant l'Application, l'utilisateur accepte sans réserve les présentes CGU.</p>
    </section>
    <section>
      <h2 className="font-bold text-base text-slate-900 mb-2">2. Description du service</h2>
      <p>NATIONAL FIT est une application de coaching sportif et nutritionnel personnalisé, reposant sur l'intelligence artificielle. Elle propose des programmes d'entraînement, des plans alimentaires, un suivi de progression et un coach virtuel.</p>
    </section>
    <section>
      <h2 className="font-bold text-base text-slate-900 mb-2">3. Accès au service</h2>
      <p>L'accès à l'Application est réservé aux personnes âgées de 16 ans et plus. L'utilisation est soumise à la création d'un compte. L'utilisateur est responsable de la confidentialité de ses identifiants.</p>
    </section>
    <section>
      <h2 className="font-bold text-base text-slate-900 mb-2">4. Avertissement médical important</h2>
      <p><strong>⚠️ AVANT DE COMMENCER :</strong> Les recommandations fournies par l'Application sont à titre informatif uniquement et ne constituent PAS des conseils médicaux, un diagnostic ou un traitement.</p>
      <p className="mt-2">Il est IMPÉRATIF de consulter un médecin ou un professionnel de santé qualifié avant de démarrer tout programme d'exercice physique ou régime alimentaire, en particulier si :</p>
      <ul className="list-disc ml-5 mt-2 space-y-1">
        <li>Vous avez des problèmes de santé préexistants (cardiaques, respiratoires, diabète, etc.)</li>
        <li>Vous êtes blessé ou en convalescence</li>
        <li>Vous êtes enceinte ou post-partum</li>
        <li>Vous n'avez pas fait d'exercice depuis une longue période</li>
        <li>Vous ressentez des douleurs, vertiges ou gênes pendant l'exercice</li>
      </ul>
      <p className="mt-2"><strong>L'Éditeur décline toute responsabilité</strong> en cas de blessures, dommages corporels ou matériels résultant de l'utilisation des programmes, exercices ou conseils nutritionnels proposés dans l'Application. L'utilisateur participe à ses propres risques.</p>
      <p className="mt-2 text-xs italic text-slate-500">Conformément aux guidelines Apple App Store et Google Play Store (section Santé & Forme), cette application ne se substitue pas à un avis médical professionnel.</p>
    </section>
    <section>
      <h2 className="font-bold text-base text-slate-900 mb-2">5. Abonnement Premium</h2>
      <p>L'Application propose un abonnement Premium (mensuel à 10€/mois ou annuel à 60€/an) donnant accès à des fonctionnalités avancées.</p>
      <p className="mt-2"><strong>Paiement :</strong> Le paiement est géré via notre site web par <strong>Stripe</strong> (processeur de paiement sécurisé, certifié PCI-DSS niveau 1).</p>
      <p className="mt-2"><strong>Conformité Apple App Store & Google Play Store :</strong> Conformément aux exigences des stores, les utilisateurs peuvent gérer leur abonnement directement via leur compte Stripe. Pour iOS, les utilisateurs peuvent également gérer leurs achats via les paramètres de leur compte Apple. Pour Android, via les paramètres Google Play. Aucun achat in-app n'est effectué directement dans l'application mobile.</p>
      <p className="mt-2"><strong>Renouvellement :</strong> L'abonnement se renouvelle automatiquement sauf résiliation avant la date d'échéance.</p>
      <p className="mt-2"><strong>Remboursement :</strong> Conformément à la réglementation européenne, vous disposez d'un droit de rétractation de 14 jours à compter de la souscription, sauf si vous avez expressément demandé à bénéficier du service avant l'expiration de ce délai. Aucun remboursement ne sera accordé pour une période déjà entamée au-delà de ce délai.</p>
      <p className="mt-2"><strong>Résiliation :</strong> L'utilisateur peut résilier à tout moment depuis son espace client Stripe ou en contactant le support à <a href="mailto:nfitfrance@outlook.fr" className="text-blue-600 underline">nfitfrance@outlook.fr</a>.</p>
    </section>
    <section>
      <h2 className="font-bold text-base text-slate-900 mb-2">6. Propriété intellectuelle</h2>
      <p>L'ensemble des contenus de l'Application (textes, images, logos, code, etc.) est la propriété exclusive de l'Éditeur et est protégé par le droit de la propriété intellectuelle français. Toute reproduction, distribution ou modification sans autorisation est interdite.</p>
    </section>
    <section>
      <h2 className="font-bold text-base text-slate-900 mb-2">7. Comportement de l'utilisateur</h2>
      <p>L'utilisateur s'engage à utiliser l'Application de bonne foi, à ne pas tenter d'en compromettre la sécurité, à ne pas partager son accès et à ne pas détourner les fonctionnalités à des fins illicites.</p>
    </section>
    <section>
      <h2 className="font-bold text-base text-slate-900 mb-2">8. Limitation de responsabilité</h2>
      <p>L'Éditeur s'efforce de maintenir l'Application accessible 24h/24, 7j/7, mais ne peut garantir une disponibilité ininterrompue. L'Éditeur ne saurait être tenu responsable des dommages indirects résultant de l'utilisation de l'Application.</p>
    </section>
    <section>
      <h2 className="font-bold text-base text-slate-900 mb-2">9. Modification des CGU</h2>
      <p>L'Éditeur se réserve le droit de modifier les présentes CGU à tout moment. L'utilisateur sera informé des modifications via l'Application. La poursuite de l'utilisation de l'Application après modification vaut acceptation des nouvelles CGU.</p>
    </section>
    <section>
      <h2 className="font-bold text-base text-slate-900 mb-2">10. Droit applicable</h2>
      <p>Les présentes CGU sont soumises au droit français. Tout litige sera soumis aux tribunaux compétents de Paris.</p>
    </section>
    <p className="text-xs text-slate-400 pt-2">Dernière mise à jour : Mai 2025</p>
  </div>
);

const Privacy = () => (
  <div className="space-y-5 text-sm text-slate-700 leading-relaxed">
    <section>
      <h2 className="font-bold text-base text-slate-900 mb-2">1. Responsable du traitement</h2>
      <p>Brochier Bastien, éditeur de NATIONAL FIT -- contact : <a href="mailto:nfitfrance@outlook.fr" className="text-blue-600 underline">nfitfrance@outlook.fr</a></p>
    </section>
    <section>
      <h2 className="font-bold text-base text-slate-900 mb-2">2. Données collectées</h2>
      <p>Nous collectons les données suivantes :</p>
      <ul className="list-disc ml-5 mt-2 space-y-1">
        <li><strong>Données d'identification</strong> : adresse e-mail, prénom</li>
        <li><strong>Données de profil sportif</strong> : âge, genre, taille, poids, objectifs, niveau, équipement</li>
        <li><strong>Données de santé</strong> : blessures déclarées, préférences alimentaires (traitement sur base du consentement explicite)</li>
        <li><strong>Photos corporelles</strong> (optionnel, consentement explicite)</li>
        <li><strong>Données d'usage</strong> : séances effectuées, progression, XP</li>
        <li><strong>Données de paiement</strong> : gérées exclusivement par Stripe (nous ne stockons pas de données bancaires)</li>
      </ul>
    </section>
    <section>
      <h2 className="font-bold text-base text-slate-900 mb-2">3. Finalités du traitement</h2>
      <ul className="list-disc ml-5 space-y-1">
        <li>Fourniture et personnalisation du service</li>
        <li>Génération de programmes IA adaptés</li>
        <li>Gestion des abonnements et facturation</li>
        <li>Amélioration de l'Application</li>
        <li>Communication support</li>
      </ul>
    </section>
    <section>
      <h2 className="font-bold text-base text-slate-900 mb-2">4. Base légale</h2>
      <p>Le traitement repose sur l'exécution du contrat (CGU), le consentement (données de santé, photos) et l'intérêt légitime (amélioration du service).</p>
    </section>
    <section>
      <h2 className="font-bold text-base text-slate-900 mb-2">5. Durée de conservation</h2>
      <p>Les données sont conservées pour la durée de l'utilisation du compte + 3 ans après clôture, sauf obligation légale contraire.</p>
    </section>
    <section>
      <h2 className="font-bold text-base text-slate-900 mb-2">6. Partage des données</h2>
      <p>Vos données ne sont pas vendues. Elles peuvent être partagées avec :</p>
      <ul className="list-disc ml-5 mt-2 space-y-1">
        <li><strong>Supabase</strong> (infrastructure technique)</li>
        <li><strong>Stripe</strong> (paiements)</li>
        <li><strong>OpenAI / Google</strong> (génération IA -- données anonymisées/pseudonymisées)</li>
      </ul>
    </section>
    <section>
      <h2 className="font-bold text-base text-slate-900 mb-2">7. Vos droits (RGPD)</h2>
      <p>Conformément au RGPD, vous disposez des droits suivants :</p>
      <ul className="list-disc ml-5 mt-2 space-y-1">
        <li>Droit d'accès à vos données</li>
        <li>Droit de rectification</li>
        <li>Droit à l'effacement (« droit à l'oubli »)</li>
        <li>Droit à la portabilité</li>
        <li>Droit d'opposition au traitement</li>
        <li>Droit de retirer votre consentement à tout moment</li>
      </ul>
      <p className="mt-2">Pour exercer vos droits : <a href="mailto:nfitfrance@outlook.fr" className="text-blue-600 underline">nfitfrance@outlook.fr</a>. Vous pouvez aussi introduire une réclamation auprès de la <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">CNIL</a>.</p>
    </section>
    <section>
      <h2 className="font-bold text-base text-slate-900 mb-2">8. Sécurité des données</h2>
      <p>Nous mettons en œuvre des mesures techniques et organisationnelles conformes au RGPD pour protéger vos données :</p>
      <ul className="list-disc ml-5 mt-2 space-y-1">
        <li>Chiffrement SSL/TLS pour toutes les communications</li>
        <li>Authentification sécurisée avec sessions limitées dans le temps</li>
        <li>Accès aux données restreint par Row Level Security (RLS)</li>
        <li>Hébergement sur serveurs sécurisés (Supabase, conforme SOC 2)</li>
        <li>Données de paiement externalisées chez Stripe (PCI-DSS niveau 1)</li>
        <li>Sauvegardes automatiques régulières</li>
      </ul>
    </section>
    <section>
      <h2 className="font-bold text-base text-slate-900 mb-2">9. Transfert de données hors UE</h2>
      <p>Certaines données peuvent être transférées hors de l'Union Européenne (ex: services IA OpenAI/Google). Ces transferts sont encadrés par des Clauses Contractuelles Types de la Commission Européenne et des garanties appropriées.</p>
    </section>
    <section>
      <h2 className="font-bold text-base text-slate-900 mb-2">10. Cookies et stockage local</h2>
      <p>L'Application utilise :</p>
      <ul className="list-disc ml-5 mt-2 space-y-1">
        <li>Cookies techniques nécessaires à l'authentification (session)</li>
        <li>LocalStorage pour les préférences utilisateur (langue, tutoriels, check-in quotidien)</li>
        <li>Aucun cookie publicitaire ou de tracking tiers</li>
      </ul>
      <p className="mt-2">Conformément à l'article 82 de la loi Informatique et Libertés et au RGPD, ces cookies ne nécessitent pas de consentement préalable car ils sont strictement nécessaires au fonctionnement du service.</p>
    </section>
    <section>
      <h2 className="font-bold text-base text-slate-900 mb-2">11. Mineurs</h2>
      <p>L'Application est interdite aux enfants de moins de 16 ans sans autorisation parentale. Conformément aux exigences Apple App Store et Google Play Store, nous nous engageons à ne pas collecter sciemment de données personnelles d'enfants de moins de 13 ans (COPPA) ou 16 ans (RGPD).</p>
    </section>
    <p className="text-xs text-slate-400 pt-2">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
  </div>
);

const Mentions = () => (
  <div className="space-y-5 text-sm text-slate-700 leading-relaxed">
    <section>
      <h2 className="font-bold text-base text-slate-900 mb-2">Éditeur de l'application</h2>
      <p><strong>NATIONAL FIT</strong><br />
      Éditeur : Brochier Bastien<br />
      Adresse : France<br />
      Email : <a href="mailto:nfitfrance@outlook.fr" className="text-blue-600 underline">nfitfrance@outlook.fr</a>
      </p>
    </section>
    <section>
      <h2 className="font-bold text-base text-slate-900 mb-2">Hébergement</h2>
      <p><strong>Supabase, Inc. (supabase.com)</strong><br />
      Infrastructure backend : base de données PostgreSQL, authentification, stockage de fichiers<br />
      Serveurs sécurisés avec chiffrement SSL/TLS, conformité SOC 2
      </p>
    </section>
    <section>
      <h2 className="font-bold text-base text-slate-900 mb-2">Paiements</h2>
      <p><strong>Stripe, Inc.</strong><br />
      185 Berry Street, Suite 550, San Francisco, CA 94107, USA<br />
      Prestataire de paiement certifié PCI-DSS.<br />
      <a href="https://stripe.com/fr/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Politique de confidentialité Stripe</a>
      </p>
      <p className="mt-2 text-xs text-slate-500 italic">Note : Les abonnements souscrits via l'application mobile iOS ou Android sont traités sur notre site web via Stripe et ne sont pas gérés par Apple Inc. ni Google LLC. Apple et Google ne sont pas parties à cette transaction et ne fournissent aucun remboursement pour ces achats.</p>
    </section>
    <section>
      <h2 className="font-bold text-base text-slate-900 mb-2">Technologies IA</h2>
      <p>L'Application utilise des services d'intelligence artificielle (OpenAI, Google Gemini) pour la génération personnalisée de contenus sportifs et nutritionnels.</p>
    </section>
    <section>
      <h2 className="font-bold text-base text-slate-900 mb-2">Propriété intellectuelle</h2>
      <p>L'ensemble des contenus (textes, graphismes, code source, marque NATIONAL FIT) est la propriété exclusive de Brochier Bastien et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle.</p>
    </section>
    <section>
      <h2 className="font-bold text-base text-slate-900 mb-2">Droit applicable</h2>
      <p>Les présentes mentions légales sont soumises au droit français. Tribunal compétent : Paris.</p>
    </section>
    <p className="text-xs text-slate-400 pt-2">© 2025 NATIONAL FIT -- Tous droits réservés</p>
  </div>
);

export default function Legal() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'cgu');

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-blue-100 transition-colors">
            <ArrowLeft className="h-5 w-5 text-blue-600" />
          </button>
          <div>
            <h1 className="font-heading text-2xl tracking-wider text-blue-700">LÉGAL</h1>
            <p className="text-xs text-slate-500">Informations juridiques</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white rounded-2xl p-1 border border-slate-200 shadow-sm gap-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-500 hover:text-blue-600'
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
        >
          {activeTab === 'cgu' && <CGU />}
          {activeTab === 'privacy' && <Privacy />}
          {activeTab === 'mentions' && <Mentio