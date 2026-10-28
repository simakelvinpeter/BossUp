/* English keys stay beside their French and Kirundi translations for easy editing. */
const languagePhrases = [
  ["Language", "Langue", "Ururimi"],
  ["Home", "Accueil", "Ahabanza"],
  ["Marketplace", "Campagnes", "Imigambi"],
  ["Dashboard", "Tableau de bord", "Incamake"],
  ["Campaign", "Campagne", "Umugambi"],
  ["Campaigns", "Campagnes", "Imigambi"],
  ["Browse campaigns", "Voir les campagnes", "Raba imigambi"],
  [
    "Browse live campaigns",
    "Voir les campagnes actives",
    "Raba imigambi iriko irakora",
  ],
  ["View campaign", "Voir la campagne", "Raba umugambi"],
  ["All Countries", "Tous les pays", "Ibihugu vyose"],
  ["Country", "Pays", "Igihugu"],
  ["Kenya", "Kenya", "Kenya"],
  ["Tanzania", "Tanzanie", "Tanzaniya"],
  ["Uganda", "Ouganda", "Ubuganda"],
  ["Rwanda", "Rwanda", "Urwanda"],
  ["Currency", "Devise", "Ifaranga"],
  [
    "BIF — Burundian franc",
    "BIF — Franc burundais",
    "BIF — Ifaranga ry'Uburundi",
  ],
  ["Sign In", "Se connecter", "Injira"],
  ["Sign in", "Se connecter", "Injira"],
  ["Sign out", "Se déconnecter", "Sohoka"],
  ["Logout", "Se déconnecter", "Sohoka"],
  ["Email Address", "Adresse e-mail", "Imeyili"],
  ["Password", "Mot de passe", "Ijambobanga"],
  ["Full Name", "Nom complet", "Amazina yose"],
  ["Create Account", "Créer un compte", "Fungura konti"],
  ["Create one", "Créer un compte", "Fungura konti"],
  [
    "Don't have an account?",
    "Vous n’avez pas de compte ?",
    "Nta konti urafise?",
  ],
  [
    "Already have an account?",
    "Vous avez déjà un compte ?",
    "Usanzwe ufise konti?",
  ],
  [
    "Enter your credentials to access your account",
    "Saisissez vos identifiants pour accéder à votre compte",
    "Shiramwo amakuru yawe kugira winjire muri konti",
  ],
  ["I want to", "Je souhaite", "Nshaka"],
  ["I agree to the", "J’accepte les", "Ndemeje"],
  ["and", "et", "na"],
  ["Terms of Service", "Conditions d’utilisation", "Amategeko yo gukoresha"],
  [
    "Privacy Policy",
    "Politique de confidentialité",
    "Ingingo zo gukingira amakuru",
  ],
  ["Donate", "Faire un don", "Tanga intererano"],
  ["Donations", "Dons", "Intererano"],
  ["Donors", "Donateurs", "Abaterankunga"],
  ["DONOR", "DONATEUR", "UMUTERANKUNGA"],
  ["Raise Capital", "Collecter des fonds", "Rondera intererano"],
  [
    "Get funding for your business",
    "Obtenir du soutien pour votre activité",
    "Ronka intererano y’igikorwa cawe",
  ],
  [
    "Support campaigns through donations; no financial return",
    "Soutenir des campagnes par des dons, sans rendement financier",
    "Shigikira imigambi mu gutanga intererano, ata nyungu z’amafaranga zisezeranijwe",
  ],
  ["Get Started", "Commencer", "Tangira"],
  ["Start Donating", "Faire un don", "Tanga intererano"],
  ["Join as Donor", "Devenir donateur", "Ba umuterankunga"],
  ["Join as Entrepreneur", "Devenir porteur de projet", "Ba nyene umugambi"],
  ["Learning", "Guides", "Inyigisho"],
  ["Learning Centre", "Centre de ressources", "Inyigisho"],
  ["Support", "Assistance", "Imfashanyo"],
  ["Help Center", "Centre d’aide", "Imfashanyo"],
  ["Help", "Aide", "Imfashanyo"],
  ["About Us", "À propos", "Ibitwerekeye"],
  ["Contact", "Contact", "Twandikire"],
  ["Terms", "Conditions", "Amategeko"],
  ["Privacy", "Confidentialité", "Ibanga ry’amakuru"],
  [
    "Cookie Policy",
    "Politique relative aux cookies",
    "Ingingo z’udukoresho two kwibuka amakuru",
  ],
  ["Platform", "Plateforme", "Urubuga"],
  ["Company", "Organisation", "Ishirahamwe"],
  ["Resources", "Ressources", "Ibikoresho"],
  ["Legal", "Informations légales", "Amategeko"],
  ["Community support", "Soutien communautaire", "Gushigikira ikibano"],
  ["Community Support", "Soutien communautaire", "Gushigikira ikibano"],
  ["Local Impact", "Impact local", "Akamaro mu kibano"],
  ["Secure Payments", "Paiements sécurisés", "Kwishura mu mutekano"],
  ["Total Transparency", "Transparence", "Gukorera ku mugaragaro"],
  ["Verified Campaigns", "Campagnes examinées", "Imigambi yasuzumwe"],
  ["How BossUp Works", "Comment fonctionne BossUp", "Uko BossUp ikora"],
  ["How It Works", "Comment ça marche", "Uko bikora"],
  ["Choose Country", "Choisir un pays", "Hitamwo igihugu"],
  ["Select Project", "Choisir un projet", "Hitamwo umugambi"],
  ["Secure Funding", "Soutenir le projet", "Shigikira umugambi"],
  ["Track & Prosper", "Suivre les progrès", "Kurikirana iterambere"],
  ["Explore Industries", "Découvrir les secteurs", "Raba ibisata vy’ibikorwa"],
  ["Agriculture", "Agriculture", "Uburimyi"],
  ["Technology", "Technologie", "Ubuhinga"],
  ["Retail", "Commerce", "Urudandazwa"],
  ["Manufacturing", "Production", "Uguhingura"],
  ["Healthcare", "Santé", "Amagara y’abantu"],
  ["Education", "Éducation", "Indero"],
  ["Food", "Alimentation", "Ibifungurwa"],
  ["Transport", "Transport", "Ukwunguruza"],
  ["Energy", "Énergie", "Inguvu zikoresha ibikoresho"],
  ["Fashion", "Mode", "Imideri"],
  ["Finance", "Finance", "Ivy’amafaranga"],
  ["Other", "Autre", "Ibindi"],
  ["General", "Général", "Muri rusangi"],
  ["TRUSTED MARKETPLACE", "CAMPAGNES EXAMINÉES", "IMIGAMBI YASUZUMWE"],
  [
    "EXPLORE EAST AFRICA",
    "DÉCOUVRIR L’AFRIQUE DE L’EST",
    "RABA AFRIKA Y’UBUSERUKO",
  ],
  ["Showing", "Affichage :", "Herekanwa"],
  ["results", "résultats", "ivyabonetse"],
  ["Sort by:", "Trier par :", "Tondeka uko:"],
  ["Newest First", "Les plus récentes", "Imishasha imbere"],
  ["Most Funded", "Les plus soutenues", "Iyashigikiwe cane"],
  [
    "Highest funding percentage",
    "Pourcentage financé le plus élevé",
    "Ijanisha ry’intererano riri hejuru",
  ],
  ["Live campaigns", "Campagnes actives", "Imigambi iriko irakora"],
  ["Countries represented", "Pays représentés", "Ibihugu biri ku rubuga"],
  ["Funds raised", "Fonds collectés", "Amafaranga yakiriwe"],
  ["Campaign model", "Type de campagne", "Ubwoko bw’umugambi"],
  ["Donation model", "Dons", "Intererano"],
  ["Goal", "Objectif", "Intumbero"],
  ["Category", "Secteur", "Igisata"],
  ["Raised", "Collecté", "Ayakiriwe"],
  ["Campaign story", "Présentation du projet", "Ivyerekeye umugambi"],
  [
    "Administrator reviewed",
    "Examiné par l’administrateur",
    "Yasuzumwe n’umuyobozi",
  ],
  ["Donation amount", "Montant du don", "Amafaranga y’intererano"],
  ["Donate through checkout", "Accéder au paiement", "Tanga intererano"],
  [
    "Donations do not provide ownership or financial returns.",
    "Les dons ne donnent aucun droit de propriété ni rendement financier.",
    "Intererano ntizitanga uburenganzira bwo gutunga igikorwa canke inyungu z’amafaranga.",
  ],
  ["Donation receipt", "Reçu du don", "Icemezo c’intererano"],
  ["Your donations", "Vos dons", "Intererano zawe"],
  ["Amount", "Montant", "Amafaranga"],
  ["Date", "Date", "Itariki"],
  ["Status", "Statut", "Uko vyifashe"],
  ["COMPLETED", "TERMINÉ", "VYARANGIYE"],
  ["PROCESSING", "EN COURS", "BIRIKO BIRAKORWA"],
  ["PENDING", "EN ATTENTE", "BIRINDIRIYE"],
  ["FAILED", "ÉCHEC", "VYANSE"],
  ["REFUNDED", "REMBOURSÉ", "YASUBIJWE"],
  ["VERIFIED", "VÉRIFIÉ", "VYEMEJWE"],
  ["REJECTED", "REFUSÉ", "VYAHANKANYWE"],
  ["LIVE", "ACTIVE", "URAKORA"],
  ["BUSINESS_OWNER", "PORTEUR DE PROJET", "NYENE UMUGAMBI"],
  ["ADMIN", "ADMINISTRATEUR", "UMUYOBOZI"],
  ["Business", "Activité", "Igikorwa"],
  ["Business Details", "Informations sur l’activité", "Ivyerekeye igikorwa"],
  ["Venture Name", "Nom du projet", "Izina ry’umugambi"],
  ["Contact Email", "E-mail de contact", "Imeyili yo guhamagarirako"],
  ["Financial Target", "Objectif de collecte", "Intumbero y’amafaranga"],
  ["Amount Needed", "Montant recherché", "Amafaranga akenewe"],
  ["The Pitch", "Présentation", "Insiguro y’umugambi"],
  ["Save as Draft", "Enregistrer le brouillon", "Bika ivyanditswe"],
  ["Submit for Review", "Soumettre pour examen", "Rungika kugira bisuzumwe"],
  [
    "Create a donation campaign",
    "Créer une campagne de dons",
    "Tangura umugambi w’intererano",
  ],
  ["New campaign", "Nouvelle campagne", "Umugambi mushasha"],
  ["Create Campaign", "Créer une campagne", "Tangura umugambi"],
  ["My Campaigns", "Mes campagnes", "Imigambi yanje"],
  ["Your campaigns", "Vos campagnes", "Imigambi yawe"],
  [
    "Your donation receipts",
    "Vos reçus de dons",
    "Ivyemezo vy’intererano zawe",
  ],
  ["Donated", "Donné", "Yatanzwe"],
  ["Confirmed donations", "Dons confirmés", "Intererano zemejwe"],
  ["Completed donations", "Dons confirmés", "Intererano zemejwe"],
  [
    "Awaiting confirmation",
    "En attente de confirmation",
    "Birindiriye kwemezwa",
  ],
  ["Campaigns supported", "Campagnes soutenues", "Imigambi yashigikiwe"],
  ["Awaiting review", "En attente d’examen", "Birindiriye gusuzumwa"],
  [
    "No records yet.",
    "Aucun enregistrement pour le moment.",
    "Nta vyanditswe biraboneka.",
  ],
  ["Admin dashboard", "Tableau d’administration", "Incamake y’ubuyobozi"],
  [
    "Campaign approval queue",
    "Campagnes à examiner",
    "Imigambi irindiriye gusuzumwa",
  ],
  ["Approve", "Approuver", "Emeza"],
  ["Reject", "Refuser", "Hakana"],
  ["Review", "Examen", "Gusuzuma"],
  ["User verification", "Vérification des utilisateurs", "Kwemeza abakoresha"],
  ["Email", "E-mail", "Imeyili"],
  ["Role", "Rôle", "Igikorwa"],
  ["Verification", "Vérification", "Kwemeza"],
  ["Users", "Utilisateurs", "Abakoresha"],
  ["Audit log", "Journal des actions", "Urutonde rw’ibikorwa"],
  ["Audit Logs", "Journal des actions", "Urutonde rw’ibikorwa"],
  ["Action", "Action", "Igikorwa"],
  ["User", "Utilisateur", "Uwukoresha"],
  ["Time", "Date", "Igihe"],
  ["Welcome", "Bienvenue", "Murakaza neza"],
  ["Records", "Enregistrements", "Ivyanditswe"],
  ["Account", "Compte", "Konti"],
  ["Overview", "Vue d’ensemble", "Incamake"],
  ["Admin Panel", "Administration", "Ubuyobozi"],
  ["Business Portal", "Espace projet", "Urubuga rw’imigambi"],
  ["Donor Portal", "Espace donateur", "Urubuga rw’abaterankunga"],
  ["Transactions", "Transactions", "Amahererekanya y’amafaranga"],
  ["Pending Approvals", "Examens en attente", "Birindiriye kwemezwa"],
  ["Settings", "Paramètres", "Uko biteguwe"],
  ["Back to Dashboard", "Retour au tableau de bord", "Subira ku ncamake"],
  ["Loading…", "Chargement…", "Biriko biraza…"],
  ["Loading campaigns…", "Chargement des campagnes…", "Imigambi iriko iraza…"],
  ["Loading campaign…", "Chargement de la campagne…", "Umugambi uriko uraza…"],
  [
    "Loading dashboard…",
    "Chargement du tableau de bord…",
    "Incamake iriko iraza…",
  ],
  ["Please sign in", "Veuillez vous connecter", "Banza winjire"],
  [
    "Invalid email or password",
    "Adresse e-mail ou mot de passe incorrect",
    "Imeyili canke ijambobanga si vyo",
  ],
  [
    "Donations are not enabled yet",
    "La collecte des dons n’est pas encore activée",
    "Kwakira intererano ntibiratangura",
  ],
  [
    "Opening secure checkout…",
    "Ouverture du paiement sécurisé…",
    "Uburyo bwo kwishura buriko burafunguka…",
  ],
  [
    "Draft saved in this browser.",
    "Brouillon enregistré dans ce navigateur.",
    "Ivyanditswe vyabitswe muri iyi porogarama.",
  ],
  [
    "This campaign is not accepting donations.",
    "Cette campagne n’accepte pas de dons.",
    "Uyu mugambi ntiwakira intererano.",
  ],
  [
    "No live campaigns match this country yet.",
    "Aucune campagne active pour ce pays.",
    "Nta migambi iriko irakora muri iki gihugu iraboneka.",
  ],
  [
    "BIF donations will open once a Burundi payment provider is connected. No money can be collected yet.",
    "Les dons en BIF seront disponibles après la connexion d’un prestataire de paiement burundais. Aucun paiement ne peut encore être collecté.",
    "Intererano mu mafaranga y’amarundi zizotangura hamaze guhuzwa uburyo bwo kwishura bwo mu Burundi. Nta mafaranga arakira.",
  ],
  [
    "Support local ideas in Burundi and East Africa.",
    "Soutenir les projets locaux au Burundi et en Afrique de l’Est.",
    "Shigikira imigambi yo mu Burundi no muri Afrika y’Ubuseruko.",
  ],
  ["Supporting a campaign", "Soutenir une campagne", "Gushigikira umugambi"],
  [
    "Creating a clear campaign",
    "Présenter clairement sa campagne",
    "Gusigura neza umugambi",
  ],
  ["Checking your payment", "Vérifier son paiement", "Gusuzuma uko wishuye"],
  [
    "Practical guides for supporting campaigns and raising donations responsibly.",
    "Des guides pratiques pour soutenir des campagnes et collecter des dons de manière responsable.",
    "Inyigisho zo gushigikira imigambi no kwakira intererano neza.",
  ],
  [
    "Tell your story clearly to attract the right donors. Transparency builds trust.",
    "Présentez clairement votre projet aux donateurs. La transparence inspire confiance.",
    "Sigura neza umugambi wawe kugira abaterankunga bawutahure. Gukorera ku mugaragaro bituma abantu bakwizigira.",
  ],
  [
    "Tell donors why they should donate in your venture",
    "Expliquez pourquoi soutenir votre projet",
    "Sigurira abaterankunga igituma boshigikira umugambi wawe",
  ],
  [
    "Campaigns are reviewed before appearing in the marketplace. Donations support their stated goals without promising financial returns.",
    "Les campagnes sont examinées avant leur publication. Les dons soutiennent leurs objectifs, sans promesse de rendement financier.",
    "Imigambi irasuzumwa imbere yo gushirwa ku rubuga. Intererano zishigikira intumbero zayo, ata nyungu z’amafaranga zisezeranijwe.",
  ],
  [
    "Explore administrator-reviewed campaigns and support their stated goals through donations.",
    "Découvrez les campagnes examinées et soutenez leurs objectifs par des dons.",
    "Raba imigambi yasuzumwe n’ubuyobozi maze uyishigikire mu gutanga intererano.",
  ],
  [
    "Support projects and follow your donation receipts.",
    "Soutenez des projets et consultez vos reçus de dons.",
    "Shigikira imigambi kandi ukurikirane ivyemezo vy’intererano zawe.",
  ],
  [
    "Support local communities",
    "Soutenir les communautés locales",
    "Shigikira ibibano",
  ],
  [
    "A clear campaign story helps donors understand your project.",
    "Une présentation claire aide les donateurs à comprendre votre projet.",
    "Gusigura neza umugambi wawe bifasha abaterankunga kuwutahura.",
  ],
  [
    "Support campaigns through donations",
    "Soutenir les campagnes par des dons",
    "Shigikira imigambi mu gutanga intererano",
  ],
  [
    "Create an account to start donating in verified businesses or raise capital for your venture.",
    "Créez un compte pour soutenir des projets examinés ou collecter des dons pour votre activité.",
    "Fungura konti kugira ushigikire imigambi yasuzumwe canke urondere intererano y’igikorwa cawe.",
  ],
  [
    "Join East Africa's Leading Donation Platform",
    "Rejoindre la plateforme de dons",
    "Injira ku rubuga rw’intererano",
  ],
  [
    "Start your donation journey today",
    "Commencer à soutenir des projets",
    "Tangira gushigikira imigambi",
  ],
  ["Secure & Verified", "Sécurité et vérification", "Umutekano no gusuzuma"],
  [
    "Every business is verified before listing",
    "Les projets sont examinés avant publication",
    "Imigambi irasuzumwa imbere yo gushirwa ku rubuga",
  ],
  ["Easy Payments", "Paiement simplifié", "Kwishura vyoroshe"],
  [
    "M-Pesa, cards, and bank transfers",
    "Les moyens de paiement dépendent du prestataire connecté",
    "Uburyo bwo kwishura buva ku mutanga serivisi yahujwe",
  ],
  ["Trusted Community", "Communauté solidaire", "Ikibano c’abashigikirana"],
  [
    "Bridging the gap between East African innovation and global capital. Whether you're looking to support a project or launch your own, BossUp is your partner.",
    "BossUp met en relation les porteurs de projets et leurs soutiens au Burundi et en Afrique de l’Est.",
    "BossUp ihuza abafise imigambi n’abayishigikira mu Burundi no muri Afrika y’Ubuseruko.",
  ],
  [
    "Rigorous due diligence process. We verify every business and entrepreneur before they list.",
    "L’administrateur examine les porteurs de projets avant d’ouvrir les campagnes aux dons.",
    "Umuyobozi asuzuma abafise imigambi imbere y’uko batangura kwakira intererano.",
  ],
  [
    "Full visibility on funds usage with real-time tracking and reporting on every project you back.",
    "Consultez les objectifs des projets et vos reçus de dons confirmés.",
    "Raba intumbero z’imigambi n’ivyemezo vy’intererano zawe zemejwe.",
  ],
  [
    "Make a difference. Your donations directly create jobs and empower local communities.",
    "Soutenez les objectifs présentés par les porteurs de projets locaux.",
    "Shigikira intumbero zashikirijwe n’abafise imigambi yo mu kibano.",
  ],
  [
    "Donate with peace of mind using our hosted checkout provided by our payment partner.",
    "Utilisez le paiement hébergé lorsqu’un prestataire approuvé est connecté.",
    "Koresha uburyo bwo kwishura igihe umutanga serivisi yemewe yamaze guhuzwa.",
  ],
  [
    "Donate by choosing a country. Each country has its own verified projects and rules.",
    "Choisissez un pays pour découvrir ses projets.",
    "Hitamwo igihugu kugira ubone imigambi yaco.",
  ],
  [
    "Simple steps to start your journey towards financial growth and community impact.",
    "Quelques étapes pour soutenir des projets locaux.",
    "Intambwe nke zo gushigikira imigambi yo mu kibano.",
  ],
  [
    "Start by selecting a region. Each country has its own unique verified projects and regulations.",
    "Choisissez le pays dans lequel vous souhaitez soutenir un projet.",
    "Hitamwo igihugu ushaka gushigikiramwo umugambi.",
  ],
  [
    "Browse vetted businesses across diverse sectors. Find opportunities that match your goals.",
    "Découvrez les campagnes examinées et choisissez le projet que vous souhaitez soutenir.",
    "Raba imigambi yasuzumwe maze uhitemwo uwo ushaka gushigikira.",
  ],
  [
    "Payment methods automatically adjust based on the selected country. Enjoy secure local payments.",
    "Les moyens de paiement disponibles dépendent du pays, de la devise et du prestataire connecté.",
    "Uburyo bwo kwishura buboneka buva ku gihugu, ifaranga n’umutanga serivisi yahujwe.",
  ],
  [
    "Follow campaign progress with full transparency and traceable transactions on the platform.",
    "Consultez la progression des campagnes et vos reçus de paiement.",
    "Kurikirana iterambere ry’imigambi n’ivyemezo vy’uko wishuye.",
  ],
  [
    "Find opportunities in sectors you care about.",
    "Découvrez les projets dans les secteurs qui vous intéressent.",
    "Raba imigambi iri mu bisata bigushimisha.",
  ],
  ["Top Opportunities This Week", "Campagnes à découvrir", "Imigambi woraba"],
  [
    "Ready to BossUp?",
    "Prêt à soutenir un projet ?",
    "Witeguriye gushigikira umugambi?",
  ],
  [
    "Join youth and donors building the future of Africa's economy today.",
    "Rejoignez les porteurs de projets et les donateurs qui soutiennent leur communauté.",
    "Injira mu bandi bafise imigambi n’abaterankunga bashigikira ibibano vyabo.",
  ],
  [
    "The premier digital donation marketplace for East African youth and global donors.",
    "Une plateforme de dons pour les projets au Burundi et en Afrique de l’Est.",
    "Urubuga rw’intererano ku migambi yo mu Burundi no muri Afrika y’Ubuseruko.",
  ],
  [
    "Get the latest donation opportunities.",
    "Découvrir les nouvelles campagnes.",
    "Raba imigambi mishasha yo gushigikira.",
  ],
  [
    "Campaign donations support the stated project. No ownership, interest or profit is promised. Checkout availability depends on the payment provider and campaign currency.",
    "Les dons soutiennent le projet présenté, sans droit de propriété, intérêt ni bénéfice promis. Le paiement dépend du prestataire et de la devise.",
    "Intererano zishigikira umugambi wasiguwe. Nta burenganzira bwo gutunga igikorwa canke inyungu zisezeranijwe. Kwishura kuva ku mutanga serivisi n’ifaranga ry’umugambi.",
  ],
  [
    "Read the campaign story, country, currency and funding goal. Donations support a project; they do not buy ownership or promise a financial return. Sign in as a donor, enter an amount and use the hosted checkout. Your dashboard shows only receipts confirmed by the payment provider.",
    "Lisez la présentation, le pays, la devise et l’objectif de la campagne. Les dons n’achètent aucun droit de propriété et ne promettent aucun rendement. Connectez-vous comme donateur, indiquez le montant et utilisez le paiement hébergé lorsqu’il est disponible. Les reçus confirmés apparaissent dans votre espace.",
    "Soma ivyerekeye umugambi, igihugu, ifaranga n’intumbero y’amafaranga. Intererano ntiziguha uburenganzira bwo gutunga igikorwa kandi nta nyungu zisezeranijwe. Injira nk’umuterankunga, shiramwo amafaranga maze wishure igihe uburyo bwo kwishura buboneka. Ivyemezo vyemejwe biboneka mu ncamake yawe.",
  ],
  [
    "Use a specific title and explain what the business does, how the requested funds will be used, and the intended community benefit. Choose the currency carefully. Save a draft before submitting. An administrator reviews the owner and campaign before donations open.",
    "Choisissez un titre précis et expliquez l’activité, l’utilisation des fonds et l’intérêt pour la communauté. Sélectionnez la devise avec soin et enregistrez un brouillon. L’administrateur examine le porteur du projet et la campagne avant l’ouverture des dons.",
    "Tanga izina ritomoye, usigure igikorwa, uko amafaranga azokoreshwa n’akamaro ku kibano. Hitamwo neza ifaranga kandi ubike ivyanditswe imbere yo kubirungika. Umuyobozi asuzuma nyene umugambi n’umugambi imbere yo kwakira intererano.",
  ],
  [
    "A return from checkout is not proof of payment. BossUp verifies the provider receipt before showing a completed donation. If a payment is processing, check your dashboard later. Keep the provider receipt and BossUp transaction reference for support or a refund request.",
    "Le retour depuis le paiement ne constitue pas une preuve de paiement. BossUp vérifie le reçu avant de confirmer le don. Si le paiement est en cours, consultez votre espace plus tard. Conservez le reçu et la référence BossUp pour toute demande d’assistance ou de remboursement.",
    "Gusubira kuri BossUp uvuye ku rupapuro rwo kwishura si icemezo c’uko wishuye. BossUp isuzuma icemezo imbere yo kwemeza intererano. Nimba kwishura bikiriko birakorwa, uzosubire kuraba incamake. Bika icemezo n’inomero ya BossUp kugira usabe imfashanyo canke gusubizwa amafaranga.",
  ],
  [
    "Business Account Required",
    "Compte porteur de projet requis",
    "Hakenewe konti ya nyene umugambi",
  ],
  [
    "To create a campaign, you need to sign in with a Business Owner account.",
    "Pour créer une campagne, connectez-vous avec un compte porteur de projet.",
    "Kugira utangure umugambi, injira ukoresheje konti ya nyene umugambi.",
  ],
  [
    "Sign In as Business Owner",
    "Se connecter comme porteur de projet",
    "Injira nka nyene umugambi",
  ],
  [
    "Create Business Account",
    "Créer un compte porteur de projet",
    "Fungura konti ya nyene umugambi",
  ],
  ["DRAFT MODE", "BROUILLON", "IVYANDITSWE BITARARUNGIKWA"],
  [
    "STATUS: PENDING SUBMISSION",
    "STATUT : À SOUMETTRE",
    "BIRINDIRIYE KURUNGIKWA",
  ],
  ["PRO TIP", "CONSEIL", "IMPANURO"],
  ["Media", "Images", "Amashusho"],
  ["Financials", "Objectif financier", "Intumbero y’amafaranga"],
  ["Preview", "Aperçu", "Raba imbere yo kurungika"],
  [
    "Campaigns are reviewed by BossUp admins within 48 hours. Ensure all legal documents are attached before submitting.",
    "Les administrateurs examinent les campagnes avant leur publication.",
    "Abayobozi basuzuma imigambi imbere yo kuyishira ku rubuga.",
  ],
  [
    "An administrator reviews campaigns before donations open. Campaign disbursements require manual settlement review.",
    "Un administrateur examine les campagnes avant l’ouverture des dons. Les versements aux porteurs de projets sont vérifiés manuellement.",
    "Umuyobozi asuzuma imigambi imbere yo kwakira intererano. Gutanga amafaranga kuri bene imigambi birasuzumwa n’ubuyobozi.",
  ],
  [
    "Verify the campaign owner before approval. Only verified payment receipts count toward campaign totals.",
    "Vérifiez le porteur du projet avant approbation. Seuls les reçus de paiement vérifiés sont comptabilisés.",
    "Suzuma nyene umugambi imbere yo kuwemeza. Ivyemezo vy’ukwishura vyasuzumwe ni vyo biharurwa mu mafaranga yakiriwe.",
  ],
  [
    "Please check the form and try again.",
    "Veuillez vérifier le formulaire et réessayer.",
    "Suzuma ivyo wanditse maze wongere ugerageze.",
  ],
  [
    "No completed payment was supplied. Check your donations dashboard. A cancelled checkout is not a receipt.",
    "Aucun paiement confirmé n’a été fourni. Consultez vos dons. Un paiement annulé n’est pas un reçu.",
    "Nta kwishura kwemejwe kwabonywe. Raba incamake y’intererano zawe. Kwishura kwahagaritswe si icemezo.",
  ],
  [
    "Checking the payment with the provider…",
    "Vérification du paiement…",
    "Turiko turasuzuma uko wishuye…",
  ],
  ["Confirm payment", "Confirmer le paiement", "Emeza ukwishura"],
  [
    "Reason for rejecting this campaign:",
    "Motif du refus de cette campagne :",
    "Igituma uhakanye uyu mugambi:",
  ],
  ["Campaign unavailable", "Campagne indisponible", "Umugambi ntuboneka"],
  [
    "Choose a campaign from the marketplace.",
    "Choisissez une campagne dans la liste.",
    "Hitamwo umugambi ku rutonde.",
  ],
  ["Enter your website name", "Nom", "Izina"],
];

languagePhrases.push(
  [
    "Your Campaign Preview",
    "Aperçu de votre campagne",
    "Uko umugambi wawe uboneka",
  ],
  [
    "Entrepreneur Dashboard",
    "Espace porteur de projet",
    "Incamake ya nyene umugambi",
  ],
  [
    "Describe your business model, market opportunity, competitive advantage, and how you plan to use the funds...",
    "Présentez votre activité, ses objectifs et l’utilisation prévue des fonds...",
    "Sigura igikorwa cawe, intumbero zaco n’uko uzokoresha amafaranga...",
  ],
  ["Enter your password", "Votre mot de passe", "Ijambobanga ryawe"],
  ["Minimum 8 characters", "Au moins 8 caractères", "N’imiburiburi indome 8"],
  ["John Doe", "Votre nom complet", "Amazina yawe yose"],
  ["Search...", "Rechercher...", "Rondera..."],
  [
    "Payment options depend on the connected provider",
    "Les moyens de paiement dépendent du prestataire connecté",
    "Uburyo bwo kwishura buva ku mutanga serivisi yahujwe",
  ],
);

const phraseLookup = new Map(
  languagePhrases.map(([english, french, kirundi]) => [
    english,
    { fr: french, rn: kirundi },
  ]),
);
let chosenLanguage = "en";
try {
  chosenLanguage = localStorage.getItem("bossup-language") || "en";
} catch (_) {}
if (!["en", "fr", "rn"].includes(chosenLanguage)) chosenLanguage = "en";

window.BossUpI18n = {
  get language() {
    return chosenLanguage;
  },
  get locale() {
    return { en: "en-BI", fr: "fr-BI", rn: "rn-BI" }[chosenLanguage];
  },
  text(english) {
    return phraseLookup.get(english)?.[chosenLanguage] || english;
  },
};

const translatedNodes = new WeakMap();
const translatedAttributes = new WeakMap();
function translateNode(node) {
  if (
    node.parentElement?.closest(
      "script, style, textarea, [data-no-translate], .campaign-title, .campaign-description, .campaign-main h1, #campaign-story, #dashboard-title, #dashboard-records tbody td:first-child, .user-name, .profile-name",
    )
  )
    return;
  const current = node.nodeValue;
  const previous = translatedNodes.get(node);
  const original =
    previous?.translated === current ? previous.original : current;
  const core = original.trim();
  const key = core.replace(/\s+/g, " ");
  const translated = phraseLookup.has(key)
    ? original.replace(core, BossUpI18n.text(key))
    : original;
  if (node.nodeValue !== translated) node.nodeValue = translated;
  translatedNodes.set(node, { original, translated });
}

function translatePage() {
  observer.disconnect();
  document.documentElement.lang = chosenLanguage;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) translateNode(walker.currentNode);
  document
    .querySelectorAll("[placeholder], [aria-label]")
    .forEach((element) => {
      const saved = translatedAttributes.get(element) || {};
      for (const attribute of ["placeholder", "aria-label"]) {
        if (!element.hasAttribute(attribute)) continue;
        const value = element.getAttribute(attribute);
        const previous = saved[attribute];
        const original =
          previous?.translated === value ? previous.original : value;
        const translated = BossUpI18n.text(
          original.replace(/\s+/g, " ").trim(),
        );
        element.setAttribute(attribute, translated);
        saved[attribute] = { original, translated };
      }
      translatedAttributes.set(element, saved);
    });
  document.getElementById("language-choice").value = chosenLanguage;
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}
let queued = false;
const observer = new MutationObserver(() => {
  if (queued) return;
  queued = true;
  queueMicrotask(() => {
    queued = false;
    translatePage();
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const menu = document.createElement("div");
  menu.className = "language-menu";
  menu.innerHTML =
    '<label for="language-choice">Language</label><select id="language-choice" aria-label="Language"><option value="en">English</option><option value="fr">Français</option><option value="rn">Ikirundi</option></select>';
  document.body.append(menu);
  menu.querySelector("select").addEventListener("change", (event) => {
    chosenLanguage = event.target.value;
    try {
      localStorage.setItem("bossup-language", chosenLanguage);
    } catch (_) {}
    translatePage();
    document.dispatchEvent(new Event("bossup-language-change"));
  });
  translatePage();
});
