export default function Contact() {
  return (
    <div className="pt-24 pb-20 px-4 md:px-8 max-w-screen-xl mx-auto min-h-screen">
      <div className="text-center mb-16 max-w-2xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-black font-headline text-on-surface mb-6">Get in Touch</h1>
        <p className="text-xl text-on-surface-variant">We'd love to hear from you. Our team is always ready to talk about books, AI, or your recent order.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div className="space-y-12">
          <div className="flex gap-6 items-start">
            <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-primary flex-shrink-0">
              <span className="material-symbols-outlined">support_agent</span>
            </div>
            <div>
              <h3 className="text-xl font-bold font-headline mb-2">Customer Support</h3>
              <p className="text-on-surface-variant mb-2">Our support team is available 24/7 to help you with any issues.</p>
              <a href="mailto:support@smartbook.ai" className="text-primary font-bold hover:underline">support@smartbook.ai</a>
            </div>
          </div>
          
          <div className="flex gap-6 items-start">
            <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-primary flex-shrink-0">
              <span className="material-symbols-outlined">location_on</span>
            </div>
            <div>
              <h3 className="text-xl font-bold font-headline mb-2">Office Location</h3>
              <p className="text-on-surface-variant mb-2">1200 Tech Avenue, Suite 400<br/>San Francisco, CA 94107</p>
            </div>
          </div>
        </div>

        <form className="bg-surface-container-lowest p-8 border border-outline-variant/10 rounded-2xl shadow-sm space-y-6" onSubmit={e => e.preventDefault()}>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2">First Name</label>
              <input required type="text" className="w-full bg-surface-container rounded-xl px-4 py-3 border-none outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Last Name</label>
              <input required type="text" className="w-full bg-surface-container rounded-xl px-4 py-3 border-none outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Email Address</label>
            <input required type="email" className="w-full bg-surface-container rounded-xl px-4 py-3 border-none outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Message</label>
            <textarea required rows="5" className="w-full bg-surface-container rounded-xl px-4 py-3 border-none outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all resize-none"></textarea>
          </div>
          <button type="submit" className="w-full py-4 bg-on-surface text-surface-container-lowest rounded-xl font-bold hover:bg-black transition-colors">
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}
