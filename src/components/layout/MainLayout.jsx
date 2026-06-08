import Navbar from './Navbar';
import Footer from './Footer';
import './MainLayout.css';

function MainLayout({ children }) {
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
