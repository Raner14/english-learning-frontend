import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import './MainLayout.css';

function MainLayout({ children, userRole }) {
  return (
    <div className="main-layout">
      <Navbar userRole={userRole} />
      <Sidebar userRole={userRole} />
      <main className="main-layout__content">
        <div className="main-layout__page">{children}</div>
        <Footer />
      </main>
    </div>
  );
}

export default MainLayout;