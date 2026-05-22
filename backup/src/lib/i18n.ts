import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "nav": {
        "home": "Home",
        "announcements": "Announcements",
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
      }
    }
  },
  rw: {
    translation: {
      "nav": {
        "home": "Ahabanza",
        "announcements": "Amatangazo",
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
      }
    }
  },
  fr: {
    translation: {
      "nav": {
        "home": "Accueil",
        "announcements": "Annonces",
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
      }
    }
  },
  sw: {
    translation: {
      "nav": {
        "home": "Nyumbani",
        "announcements": "Matangazo",
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
