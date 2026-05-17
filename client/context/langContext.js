import { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { translations } from "../translation";

const TranslationContext = createContext();

export const TranslationProvider = ({ children }) => {
  const [language, setLanguageState] = useState("en");
  const [isReady, setIsReady] = useState(false);

  // 🔹 Load saved language on start
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLang = await AsyncStorage.getItem("app_language");
        if (savedLang) {
          setLanguageState(savedLang);
        }
      } catch (e) {
        console.log("Error loading language:", e);
      } finally {
        setIsReady(true);
      }
    };

    loadLanguage();
  }, []);

  // 🔹 Save + update language
  const setLanguage = async (lang) => {
    try {
      await AsyncStorage.setItem("app_language", lang);
      setLanguageState(lang);
    } catch (e) {
      console.log("Error saving language:", e);
    }
  };

  // 🔹 Translation function
  const t = (key) => {
    return translations[language]?.[key] || key;
  };

  // ⏳ Prevent rendering before language loads
  if (!isReady) return null;

  return (
    <TranslationContext.Provider value={{ t, language, setLanguage }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => useContext(TranslationContext);