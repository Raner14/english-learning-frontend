import { useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { useAuth } from '../../context/AuthContext';
import { getSettings } from '../../services/settingsService';
import './MainLayout.css';

function MainLayout({ children }) {
  const { user } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    getSettings()
      .then((s) => {
        document.documentElement.setAttribute('data-theme', s.theme === 'dark' ? 'dark' : 'light');
      })
      .catch(() => {});
  }, [userId]);

  return (
    <div className="main-layout">
      <Navbar />
      <main className="main-layout__content">
        <div className="main-layout__page">{children}</div>
        <Footer />
      </main>
    </div>
  );
}

export default MainLayout;
