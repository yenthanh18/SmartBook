import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import ChatbotWidget from '../shared/ChatbotWidget';

export default function Layout() {
  const location = useLocation();

  // Home already has its own hero spacing strategy.
  // Other pages also define their own top padding, so we avoid double spacing here.
  const isHome = location.pathname === '/';

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <Navbar />
      <main className={`flex-grow flex flex-col ${isHome ? 'pt-20' : ''}`}>
        <Outlet />
      </main>
      <ChatbotWidget />
      <Footer />
    </div>
  );
}
