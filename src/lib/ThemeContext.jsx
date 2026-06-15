import React, { createContext, useContext, useState, useEffect } from 'react';
import { TRANSLATIONS, THEME_PERSONALITIES } from './translations';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('nationalfit-theme');
    // Migrate old hulkfit keys
    if (!saved) {
      const old = localStorage.getItem('hulkfit-theme');
      if (old === 'captain') return 'elite';
      if (old === 'spiderman') return 'champion';
      return 'tricolore';
    }
    return saved;
  });

  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('nationalfit-language');
    return saved || localStorage.getItem('hulkfit-language') || 'fr';
  });

  useEffect(() => {
    const saved = localStorage.getItem('nationalfit-theme');
    if (saved !== theme) {
      localStorage.setItem('nationalfit-theme', theme);
      setTimeout(() => window.location.reload(), 100);
    }
  }, [theme]);

  useEffect(() => {
    const saved = localStorage.getItem('nationalfit-language');
    if (saved !== language) {
      localStorage.setItem('nationalfit-language', language);
      setTimeout(() => window.location.reload(), 100);
    }
  }, [language]);

  const t = (key) => {
    const langData = TRANSLATIONS[language] || TRANSLATIONS.fr;
    return langData[key] || TRANSLATIONS.fr[key] || key;
  };

  const getThemePersonality = () => THEME_PERSONALITIES[theme] || THEME_PERSONALITIES.tricolore;

  const getRandomGreeting = () => {
    const personality = getThemePersonality();
    const greetings = personality.greetings[language] || personality.greetings.fr;
    return greetings[Math.floor(Math.random() * greetings.length)];
  };

  const getRandomMotivationalQuote = () => {
    const personality = getThemePersonality();
    const quotes = personality.motivationalQuotes[language] || personality.motivationalQuotes.fr;
    return quotes[Math.floor(Math.random() * quotes.length)];
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      setTheme, 
      language, 
      setLanguage, 
      t, 
      getThemePersonality,
      getRandomGreeting,
      getRandomMotivationalQuote,
      TRANSLATIONS,
      THEME_PERSONALITIES 
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function useTranslation() {
  const { t, language } = useTheme();
  return { t, language };
}