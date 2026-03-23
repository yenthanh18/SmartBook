import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-50 dark:bg-slate-950 w-full py-12 px-8 mt-20 border-t border-slate-200/50">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-8 max-w-screen-2xl mx-auto pt-4">
        <div className="col-span-2">
          <div className="text-xl font-bold text-slate-900 mb-6 font-headline flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              auto_stories
            </span>
            SmartBook AI Store
          </div>
          <p className="text-sm text-slate-500 max-w-xs mb-8">
            Curating intelligence for readers through artificial intelligence and hand-picked editorial expertise. The world's first book store powered by advanced semantic intelligence.
          </p>
          <div className="flex gap-4">
            <a href="#" className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center hover:bg-primary hover:text-white transition-all">
              <span className="material-symbols-outlined text-xl">share</span>
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center hover:bg-primary hover:text-white transition-all">
              <span className="material-symbols-outlined text-xl">mail</span>
            </a>
          </div>
        </div>
        
        <div>
          <h5 className="font-bold text-slate-900 mb-6 font-headline">Shop</h5>
          <ul className="space-y-4">
            <li><Link to="/shop" className="text-slate-500 hover:text-indigo-500 hover:underline decoration-indigo-500 underline-offset-4 transition-all text-sm">All Books</Link></li>
            <li><Link to="/shop?filter=bestsellers" className="text-slate-500 hover:text-indigo-500 hover:underline decoration-indigo-500 underline-offset-4 transition-all text-sm">Bestsellers</Link></li>
            <li><Link to="/shop?filter=new" className="text-slate-500 hover:text-indigo-500 hover:underline decoration-indigo-500 underline-offset-4 transition-all text-sm">New Releases</Link></li>
            <li><Link to="/shop?filter=deals" className="text-slate-500 hover:text-indigo-500 hover:underline decoration-indigo-500 underline-offset-4 transition-all text-sm">Deals</Link></li>
          </ul>
        </div>
        
        <div>
          <h5 className="font-bold text-slate-900 mb-6 font-headline">Support</h5>
          <ul className="space-y-4">
            <li><Link to="/contact" className="text-slate-500 hover:text-indigo-500 hover:underline decoration-indigo-500 underline-offset-4 transition-all text-sm">Contact</Link></li>
            <li><a href="#" className="text-slate-500 hover:text-indigo-500 hover:underline decoration-indigo-500 underline-offset-4 transition-all text-sm">Shipping</a></li>
            <li><a href="#" className="text-slate-500 hover:text-indigo-500 hover:underline decoration-indigo-500 underline-offset-4 transition-all text-sm">Returns</a></li>
            <li><a href="#" className="text-slate-500 hover:text-indigo-500 hover:underline decoration-indigo-500 underline-offset-4 transition-all text-sm">FAQ</a></li>
          </ul>
        </div>
        
        <div>
          <h5 className="font-bold text-slate-900 mb-6 font-headline">Legal</h5>
          <ul className="space-y-4">
            <li><a href="#" className="text-slate-500 hover:text-indigo-500 hover:underline decoration-indigo-500 underline-offset-4 transition-all text-sm">Privacy Policy</a></li>
            <li><a href="#" className="text-slate-500 hover:text-indigo-500 hover:underline decoration-indigo-500 underline-offset-4 transition-all text-sm">Terms of Service</a></li>
            <li><a href="#" className="text-slate-500 hover:text-indigo-500 hover:underline decoration-indigo-500 underline-offset-4 transition-all text-sm">Cookie Policy</a></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-screen-2xl mx-auto mt-20 pt-8 border-t border-slate-200/50 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-slate-500 text-sm">© 2024 SmartBook AI Store. Curating intelligence for readers.</p>
        <div className="flex gap-6">
          <span className="material-symbols-outlined text-slate-300">payments</span>
          <span className="material-symbols-outlined text-slate-300">credit_card</span>
        </div>
      </div>
    </footer>
  );
}
