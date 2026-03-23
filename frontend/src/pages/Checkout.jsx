import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cartService } from '../services/cartService';
import { trackBeginCheckout, trackPurchaseDemo } from '../services/analyticsService';
import { unwrapObject } from '../services/apiClient';

export default function Checkout() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '', firstName: '', lastName: '', address: '', city: '', zip: '', cardNumber: '', expiry: '', cvc: ''
  });
  
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await cartService.getCheckoutSummary();
        const summaryResponse = unwrapObject(res);
        setSummary(summaryResponse);
        
        if (summaryResponse.items && summaryResponse.items.length > 0) {
          trackBeginCheckout(summaryResponse.items, summaryResponse.total);
        } else {
          // Empty cart, can't checkout
          navigate('/cart');
        }
      } catch (err) {
        setError("Failed to initialize secure checkout. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const res = await cartService.processCheckout(formData);
      const orderData = unwrapObject(res);
      const tid = orderData.order_id || orderData.transaction_id || `TRX-${Math.floor(Math.random() * 1000000)}`;
      setTransactionId(tid);
      setSuccess(true);
      trackPurchaseDemo(summary.items, summary.total, tid);
      
      // Attempt to clear cart backend after success
      cartService.clearCart().catch(() => {});
    } catch (err) {
      alert(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
     return (
        <div className="min-h-screen pt-32 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-on-surface-variant font-medium">Securing connection...</p>
        </div>
     );
  }

  if (error || !summary) {
      return (
        <div className="min-h-screen pt-32 p-8 text-center flex flex-col items-center">
            <span className="material-symbols-outlined text-6xl text-error mb-4">error</span>
            <h2 className="text-2xl font-bold font-headline">{error}</h2>
            <Link to="/cart" className="mt-8 px-6 py-3 bg-primary text-white rounded-full font-bold">Return to Cart</Link>
        </div>
      );
  }

  if (success) {
      return (
        <div className="min-h-screen pt-32 p-8 md:p-16 flex justify-center">
            <div className="bg-surface-container-lowest max-w-lg w-full p-12 rounded-3xl text-center shadow-[0px_24px_48px_-12px_rgba(74,64,224,0.15)] border border-outline-variant/10 flex flex-col items-center">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-4xl">check_circle</span>
                </div>
                <h1 className="text-3xl font-black font-headline text-on-surface mb-2">Order Confirmed</h1>
                <p className="text-on-surface-variant mb-8 text-lg">Thank you for your purchase. Your digital intelligence is being packaged.</p>
                <div className="bg-surface-container-low w-full p-4 rounded-xl mb-8 flex justify-between items-center text-sm font-medium">
                   <span className="text-on-surface-variant">Transaction ID</span>
                   <span className="font-mono">{transactionId}</span>
                </div>
                <Link to="/shop" className="w-full bg-gradient-to-r from-primary to-primary-container text-white py-4 rounded-full font-bold shadow-lg hover:scale-105 active:scale-95 transition-all outline-none">
                    Continue Shopping
                </Link>
            </div>
        </div>
      );
  }

  return (
    <div className="pt-24 pb-20 px-4 md:px-8 max-w-screen-xl mx-auto min-h-screen">
      <div className="flex flex-col lg:flex-row gap-16">
        {/* Left: Checkout Form */}
        <div className="flex-grow">
          <h1 className="text-3xl font-black font-headline mb-8 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-full">lock</span>
            Secure Checkout
          </h1>
          
          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-12">
            {/* Contact Info */}
            <section className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-outline-variant/10">
              <h2 className="text-xl font-bold font-headline mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-sm">1</span>
                Contact Information
              </h2>
              <div className="space-y-4 text-left">
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">Email address</label>
                  <input disabled={processing} required type="email" placeholder="you@example.com" className="w-full bg-surface-container border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none" 
                    onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>
            </section>

            {/* Shipping Address */}
            <section className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-outline-variant/10">
              <h2 className="text-xl font-bold font-headline mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-sm">2</span>
                Shipping Address
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">First name</label>
                  <input disabled={processing} required type="text" className="w-full bg-surface-container border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none" 
                    onChange={e => setFormData({...formData, firstName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">Last name</label>
                  <input disabled={processing} required type="text" className="w-full bg-surface-container border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none" 
                    onChange={e => setFormData({...formData, lastName: e.target.value})} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-on-surface mb-2">Address</label>
                  <input disabled={processing} required type="text" className="w-full bg-surface-container border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none" 
                    onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">City</label>
                  <input disabled={processing} required type="text" className="w-full bg-surface-container border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none" 
                    onChange={e => setFormData({...formData, city: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">ZIP / Postal code</label>
                  <input disabled={processing} required type="text" className="w-full bg-surface-container border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none" 
                    onChange={e => setFormData({...formData, zip: e.target.value})} />
                </div>
              </div>
            </section>

            {/* Payment Info */}
            <section className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-outline-variant/10">
              <h2 className="text-xl font-bold font-headline mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-sm">3</span>
                Payment Method
              </h2>
              <div className="space-y-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-on-surface mb-2">Card number</label>
                  <input disabled={processing} required type="text" placeholder="0000 0000 0000 0000" className="w-full bg-surface-container border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none font-mono" 
                    onChange={e => setFormData({...formData, cardNumber: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-2">Expiry date</label>
                    <input disabled={processing} required type="text" placeholder="MM/YY" className="w-full bg-surface-container border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none text-center" 
                      onChange={e => setFormData({...formData, expiry: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-2">CVC</label>
                    <input disabled={processing} required type="text" placeholder="123" className="w-full bg-surface-container border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none text-center" 
                      onChange={e => setFormData({...formData, cvc: e.target.value})} />
                  </div>
                </div>
              </div>
            </section>
          </form>
        </div>

        {/* Right: Order Summary */}
        <div className="w-full lg:w-[400px] flex-shrink-0">
          <div className="bg-surface-container-high p-8 rounded-2xl sticky top-32 border border-outline-variant/10">
             <h3 className="text-xl font-bold font-headline mb-6">Order Summary ({summary.items.length})</h3>
             
             {/* Mini items list */}
             <div className="space-y-3 mb-6 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {summary.items.map(item => (
                   <div key={item.product_id} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-on-surface-variant font-bold">{item.quantity}x</span>
                        <span className="truncate">{item.title}</span>
                      </div>
                      <span className="font-medium">${((item.unit_price) * item.quantity).toFixed(2)}</span>
                   </div>
                ))}
             </div>

             <div className="flex justify-between items-center mb-4 text-sm">
                <span className="text-on-surface-variant font-medium">Subtotal</span>
                <span className="font-bold">${summary.subtotal.toFixed(2)}</span>
             </div>
             <div className="flex justify-between items-center mb-4 text-sm">
                <span className="text-on-surface-variant font-medium">Taxes</span>
                <span className="font-bold">${summary.taxes.toFixed(2)}</span>
             </div>
             <div className="flex justify-between items-center mb-6 pb-6 border-b border-outline-variant/20 text-sm">
                <span className="text-on-surface-variant font-medium">Shipping</span>
                <span className="font-bold text-primary">Free</span>
             </div>
             <div className="flex justify-between items-center mb-8">
                <span className="text-lg font-bold">Total</span>
                <span className="text-3xl font-black text-on-surface">${summary.total.toFixed(2)}</span>
             </div>
             <button disabled={processing} type="submit" form="checkout-form" className="w-full py-4 px-8 rounded-xl bg-on-surface text-surface-container-lowest font-bold shadow-lg hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2">
               {processing ? <span className="material-symbols-outlined animate-spin">sync</span> : 'Pay Now'}
             </button>
             <p className="text-xs text-center text-on-surface-variant mt-6 flex justify-center items-center gap-1">
               <span className="material-symbols-outlined text-[16px]">verified_user</span> Payments are secure and encrypted.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
