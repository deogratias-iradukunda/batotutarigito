import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "nav": {
        "home": "Home",
        "announcements": "Announcements",
        "about": "About Us",
        "contact": "Contact Us",
        "login": "Login",
        "dashboard": "Dashboard",
        "logout": "Logout"
      },
      "hero": {
        "title": "Empowering Communities",
        "cta": "Join Us",
        "students": "Sponsor a Student",
        "cows": "Cow Project",
        "growth": "Together We Grow"
      },
      "stats": {
        "students": "Students Sponsored",
        "families": "Families Partnered",
        "cows": "Cows Distributed"
      },
      "mission": {
        "label": "Our Mission",
        "title": "Creating Sustainable Change Through Community Support",
        "desc": "BatoTutariGito is dedicated to uplifting the Western Rwandan community through education sponsorship and agricultural projects. We believe that by providing the right tools and support, families can achieve long-term self-sufficiency."
      },
      "cow": {
        "number": "Cow Number / Tag",
        "purchase": "Purchase Cost (RWF)",
        "date": "Date Received",
        "sourcedFamily": "Sourced Family",
        "noFamily": "-- No Family --",
        "addCow": "Add New Cow",
        "editCow": "Edit Cow Details",
        "actions": "Actions",
        "deleteConfirm": "Are you sure you want to delete this cow?",
        "inventory": "Total Cow Inventory",
        "totalCost": "Total Purchase Cost",
        "listTitle": "Livestock Registration Board"
      }
    }
  },
  rw: {
    translation: {
      "nav": {
        "home": "Ahabanza",
        "announcements": "Amatangazo",
        "about": "Ibyerekeye Twe",
        "contact": "Twandikire",
        "login": "Injira",
        "dashboard": "Idashibodi",
        "logout": "Sohoka"
      },
      "hero": {
        "title": "Gushoboza Abaturage",
        "cta": "Fatanya Natwe",
        "students": "Tera inkunga Umunyeshuri",
        "cows": "Umushinga w'Inka",
        "growth": "Dukurire hamwe"
      },
      "stats": {
        "students": "Abanyeshuri bafashwa",
        "families": "Imiryango dufasha",
        "cows": "Inka zatanzwe"
      },
      "mission": {
        "label": "Intego Yacu",
        "title": "Guhindura Ubuzima Binyuze mu Gufasha Imiryango",
        "desc": "BatoTutariGito yiyemeje kuzamura abatuye mu Burengerazuba bw'u Rwanda ibafasha mu burezi n'ubworozi. Twemera ko guha abantu ibikoresho n'ubumenyi ari bwo buryo burambye bwo kwigira."
      },
      "cow": {
        "number": "Inomero y'Inka / Tag",
        "purchase": "Ikiguzi cy'Inka (RWF)",
        "date": "Itariki Yakiriweho",
        "sourcedFamily": "Umuryango Wakiriye",
        "noFamily": "-- Nta Muryango --",
        "addCow": "Inka Nshya",
        "editCow": "Guhindura amakuru y'Inka",
        "actions": "Ibikorwa",
        "deleteConfirm": "Ese urashaka gusiba iyi nka?",
        "inventory": "Inka Zose Hamwe",
        "totalCost": "Igiteranyo cy'Ikiguzi",
        "listTitle": "Urutonde rw'Inka Zose"
      }
    }
  },
  fr: {
    translation: {
      "nav": {
        "home": "Accueil",
        "announcements": "Annonces",
        "about": "À Propos",
        "contact": "Contactez-nous",
        "login": "Connexion",
        "dashboard": "Tableau de Bord",
        "logout": "Déconnexion"
      },
      "hero": {
        "title": "Autonomiser les Communautés",
        "cta": "Rejoignez-nous"
      },
      "stats": {
        "students": "Étudiants Parrainés",
        "families": "Familles Partenaires",
        "cows": "Vaches Distribuées"
      },
      "cow": {
        "number": "Identifiant / Numéro de la Vache",
        "purchase": "Coût d'Achat (RWF)",
        "date": "Date de Réception",
        "sourcedFamily": "Famille Sourced / Bénéficiaire",
        "noFamily": "-- Pas de Famille --",
        "addCow": "Ajouter une Nouvelle Vache",
        "editCow": "Modifier les Détails de la Vache",
        "actions": "Actions",
        "deleteConfirm": "Êtes-vous sûr de vouloir supprimer cette vache ?",
        "inventory": "Inventaire Total de Vaches",
        "totalCost": "Coût d'Achat Total",
        "listTitle": "Panneau d'Enregistrement de Cheptel"
      }
    }
  },
  sw: {
    translation: {
      "nav": {
        "home": "Nyumbani",
        "announcements": "Matangazo",
        "about": "Kuhusu Sisi",
        "contact": "Wasiliana Nasi",
        "login": "Ingia",
        "dashboard": "Dashibodi",
        "logout": "Ondoka"
      },
      "hero": {
        "title": "Kuwezesha Jamii",
        "cta": "Jiunge Nasi"
      },
      "stats": {
        "students": "Wanafunzi Wadhaminiwa",
        "families": "Familia Washirika",
        "cows": "Ng'ombe Waliosambazwa"
      },
      "cow": {
        "number": "Nambari ya Ng'ombe / Lebo",
        "purchase": "Gharama ya Kununua (RWF)",
        "date": "Tarehe ya Kupokea",
        "sourcedFamily": "Familia ya Chanzo",
        "noFamily": "-- Hakuna Familia --",
        "addCow": "Ongeza Ng'ombe Mpya",
        "editCow": "Hariri Maelezo ya Ng'ombe",
        "actions": "Hatua",
        "deleteConfirm": "Je, una uhakika unataka kufuta huyu ng'ombe?",
        "inventory": "Jumla ya Ng'ombe",
        "totalCost": "Jumla ya Gharama ya Kununua",
        "listTitle": "Bodi ya Usajili wa Mifugo"
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
