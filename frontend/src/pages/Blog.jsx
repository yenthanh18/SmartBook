import { Link } from 'react-router-dom';

export default function Blog() {
  const articles = [
    { title: "The Architecture of Tomorrow", category: "System Design", readTime: "5 min read", date: "Oct 12, 2024", image: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=2670&auto=format&fit=crop" },
    { title: "Cognitive Load in Reading", category: "Psychology", readTime: "8 min read", date: "Oct 10, 2024", image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=2573&auto=format&fit=crop" },
    { title: "Building Neural Networks", category: "Machine Learning", readTime: "12 min read", date: "Oct 8, 2024", image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2672&auto=format&fit=crop" }
  ];

  return (
    <div className="pt-24 pb-20 px-4 md:px-8 max-w-screen-2xl mx-auto min-h-screen">
      <div className="text-center mb-16 max-w-2xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-black font-headline text-on-surface mb-6">The Reading Lab</h1>
        <p className="text-xl text-on-surface-variant">Insights at the intersection of human creativity and artificial intelligence.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-12">
          {articles.map((article, idx) => (
            <article key={idx} className="group cursor-pointer">
              <div className="overflow-hidden rounded-2xl mb-6 aspect-video bg-surface-container relative">
                <img src={article.image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute top-4 left-4 bg-surface-container-lowest/90 backdrop-blur text-primary text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                  {article.category}
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-on-surface-variant mb-3 font-medium">
                <span>{article.date}</span>
                <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                <span>{article.readTime}</span>
              </div>
              <h2 className="text-3xl font-bold font-headline mb-3 group-hover:text-primary transition-colors">{article.title}</h2>
              <p className="text-on-surface-variant leading-relaxed mb-4 line-clamp-2">
                Understanding how we consume information is critical to building better systems. In this essay, we explore the foundations of cognitive architecture.
              </p>
              <span className="text-primary font-bold flex items-center gap-1">Read Article <span className="material-symbols-outlined text-sm">arrow_forward</span></span>
            </article>
          ))}
        </div>

        {/* Sidebar */}
        <aside className="space-y-12">
          {/* Categories */}
          <div className="bg-surface-container-low p-8 rounded-2xl border border-outline-variant/10">
            <h3 className="text-xl font-bold font-headline mb-6">Topics</h3>
            <ul className="space-y-4">
              {['Artificial Intelligence', 'Literature Analysis', 'Author Spotlights', 'Tech & Society'].map(cat => (
                <li key={cat}>
                  <Link to="#" className="flex items-center justify-between text-on-surface-variant hover:text-primary font-medium transition-colors">
                    {cat}
                    <span className="bg-surface-container px-3 py-1 text-xs rounded-full">12</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Subscribe */}
          <div className="bg-gradient-to-br from-primary to-primary-container p-8 rounded-2xl text-white">
            <h3 className="text-xl font-bold font-headline mb-4">Join our newsletter</h3>
            <p className="text-indigo-100 text-sm mb-6">Get weekly essays on AI and reading.</p>
            <input type="email" placeholder="Your email" className="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-3 mb-4 text-white placeholder:text-indigo-200 outline-none focus:bg-white/30 transition-all" />
            <button className="w-full bg-white text-primary font-bold py-3 rounded-lg hover:shadow-lg transition-all">Subscribe</button>
          </div>
        </aside>
      </div>
    </div>
  );
}
