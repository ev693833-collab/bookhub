import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import styles from './ThemeToggle.module.css';

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Verificar se há preferência salva no localStorage
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    
    // Aplicar tema ao documento
    document.documentElement.setAttribute('data-theme', newTheme ? 'dark' : 'light');
    
    // Salvar preferência no localStorage
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  return (
    <button 
      onClick={toggleTheme}
      className={styles.themeToggle}
      title={isDark ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
    >
      {isDark ? (
        <Sun size={20} className={`${styles.icon} ${styles.settingsIcon}`} />
      ) : (
        <Moon size={20} className={`${styles.icon} ${styles.moonIcon}`} />
      )}
    </button>
  );
};

export default ThemeToggle;
