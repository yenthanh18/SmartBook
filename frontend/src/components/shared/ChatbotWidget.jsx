import { useState, useEffect, useRef } from 'react';
import { chatbotService } from '../../services/chatbotService';
import { trackOpenChatbot, trackSendChatMessage, trackChatbotRecommendationClick } from '../../services/analyticsService';
import { Link } from 'react-router-dom';
import { unwrapObject } from '../../services/apiClient';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'ai', text: "Hello! I'm your digital curator. Need help finding your next great read? Tell me what you're into!" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  // Scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleOpen = () => {
    if (!isOpen) trackOpenChatbot();
    setIsOpen(!isOpen);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { type: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);
    trackSendChatMessage('text');

    try {
      const response = await chatbotService.sendMessage(userMessage);
      const res = unwrapObject(response);
      
      const newMessages = [];
      if (res.reply || res.message || res.response) {
        newMessages.push({ type: 'ai', text: res.reply || res.message || res.response });
      }
      
      const books = res.books || res.recommendations || [];
      if (books && books.length > 0) {
        newMessages.push({ type: 'ai_books', books: books });
      }
      
      if (newMessages.length > 0) {
        setMessages(prev => [...prev, ...newMessages]);
      } else {
        setMessages(prev => [...prev, { type: 'ai', text: "I've noted that. Let me look for something brilliant." }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { type: 'ai', text: "Oops, my connection to the matrix dropped. Try again later!" }]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleBookClick = (book) => {
     trackChatbotRecommendationClick(book);
     setIsOpen(false);
  };

  return (
    <>
      <div className="fixed bottom-8 right-8 z-[110] flex flex-col items-end gap-3">
        {!isOpen && (
          <div className="bg-on-surface text-surface-container-lowest px-4 py-2 rounded-xl text-sm font-medium shadow-xl relative animate-bounce">
            Need help choosing a book?
            <div className="absolute -bottom-1 right-6 w-3 h-3 bg-on-surface rotate-45"></div>
          </div>
        )}
        
        <button 
          onClick={handleOpen}
          className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-tertiary text-white flex items-center justify-center shadow-[0px_16px_32px_-8px_rgba(74,64,224,0.4)] hover:scale-110 active:scale-90 transition-all"
        >
          <div className="relative flex items-center justify-center">
            {isOpen ? (
              <span className="material-symbols-outlined text-3xl">close</span>
            ) : (
              <>
                <span className="material-symbols-outlined text-3xl">auto_stories</span>
                <span className="absolute -top-2 -right-2 material-symbols-outlined text-lg animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              </>
            )}
          </div>
        </button>
      </div>

      {/* Open State Panel */}
      {isOpen && (
        <div className="fixed bottom-28 right-8 w-full max-w-[400px] h-[600px] bg-surface-container-lowest rounded-[20px] shadow-[0px_24px_48px_-12px_rgba(74,64,224,0.15)] flex flex-col z-[100] border border-outline-variant/10 transition-all duration-300 pointer-events-auto overflow-hidden">
          {/* Header */}
          <header className="glass-header bg-white/90 p-6 flex flex-shrink-0 items-center justify-between border-b border-outline-variant/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-tertiary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              </div>
              <div>
                <h2 className="font-headline font-bold text-on-surface text-lg leading-tight">SmartBook AI</h2>
                <p className="text-xs text-on-surface-variant">Intelligent Curation Assistant</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="material-symbols-outlined text-on-surface-variant hover:text-error transition-colors bg-surface-container w-8 h-8 rounded-full flex items-center justify-center text-sm">close</button>
          </header>

          {/* Message List */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar relative bg-surface/50">
            {messages.map((msg, idx) => {
              if (msg.type === 'user') {
                return (
                  <div key={idx} className="flex gap-3 max-w-[85%] ml-auto justify-end">
                    <div className="bg-primary text-white p-4 rounded-2xl rounded-tr-none text-sm leading-relaxed shadow-md">
                      {msg.text}
                    </div>
                  </div>
                );
              } else if (msg.type === 'ai') {
                return (
                  <div key={idx} className="flex gap-3 max-w-[85%]">
                    <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-tr from-primary-container to-tertiary-container flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                      <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    </div>
                    <div className="bg-surface-container-lowest border border-outline-variant/10 p-4 rounded-2xl rounded-tl-none text-sm leading-relaxed shadow-sm text-on-surface">
                      {msg.text}
                    </div>
                  </div>
                );
              } else if (msg.type === 'ai_books') {
                return (
                  <div key={idx} className="w-full space-y-3">
                    <p className="text-xs font-bold text-on-surface-variant px-11 uppercase tracking-wider">Recommendations</p>
                    <div className="flex gap-3 overflow-x-auto pb-4 px-11 snap-x no-scrollbar">
                      {msg.books.map(book => (
                        <Link 
                          to={`/product/${book.product_id}`} 
                          key={book.product_id}
                          onClick={() => handleBookClick(book)}
                          className="min-w-[160px] bg-surface-container-lowest rounded-xl p-3 shadow-md border border-outline-variant/10 snap-center shrink-0 hover:border-primary/30 transition-colors block"
                        >
                          <div className="aspect-[3/4] rounded bg-surface overflow-hidden mb-3">
                             <img src={book.image_url || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" alt="cover" />
                          </div>
                          <h4 className="font-bold text-sm text-on-surface leading-tight mb-1 line-clamp-2">{book.title}</h4>
                          <p className="text-xs text-on-surface-variant line-clamp-1">{book.authors}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              }
            })}
            
            {isLoading && (
               <div className="flex gap-3 max-w-[85%]">
                 <div className="w-8 h-8 shrink-0 rounded-full bg-surface-container-high flex items-center justify-center text-primary text-xs font-bold">
                   <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                 </div>
                 <div className="bg-surface-container-lowest border border-outline-variant/10 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1 shadow-sm">
                   <div className="w-2 h-2 rounded-full bg-outline-variant animate-bounce delay-75"></div>
                   <div className="w-2 h-2 rounded-full bg-outline-variant animate-bounce delay-150"></div>
                   <div className="w-2 h-2 rounded-full bg-outline-variant animate-bounce delay-300"></div>
                 </div>
               </div>
            )}
          </div>

          {/* Input */}
          <footer className="p-4 bg-white border-t border-outline-variant/10 flex-shrink-0">
            <form onSubmit={handleSend} className="relative group">
              <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type your book request..." 
                className="w-full bg-surface-container-low border border-transparent rounded-2xl py-4 pl-6 pr-14 text-sm focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest focus:border-primary/20 transition-all outline-none"
              />
              <button disabled={isLoading || !input.trim()} type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none transition-all">
                <span className="material-symbols-outlined text-[20px]">send</span>
              </button>
            </form>
          </footer>
        </div>
      )}
    </>
  );
}
