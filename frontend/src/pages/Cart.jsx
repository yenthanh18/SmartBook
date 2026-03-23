import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cartService } from '../services/cartService';
import { trackViewCart } from '../services/analyticsService';
import { unwrapObject } from '../services/apiClient';

export default function Cart() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [cartSummary, setCartSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  
  const subtotal = cartSummary?.subtotal ?? cartItems.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0);
  const taxes = cartSummary?.taxes ?? (subtotal * 0.08);
  const total = cartSummary?.total ?? (subtotal + taxes);

  const fetchCart = async () => {
    try {
      const res = await cartService.getCart();
      const cartData = unwrapObject(res);
      const items = cartData.items || [];
      setCartItems(items);
      setCartSummary(cartData.summary || null);
      if (items.length > 0) {
        trackViewCart(items, subtotal + (items.length > 0 ? (subtotal * 0.08) : 0));
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load your cart. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleUpdate = async (productId, currentQty, delta) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return handleRemove(productId);
    
    setUpdating(true);
    try {
      await cartService.updateCartItem(productId, newQty);
      // Optimistic update
      setCartItems(items => items.map(item => 
        (item.product_id === productId) 
          ? { ...item, quantity: newQty } 
          : item
      ));
    } catch (err) {
      alert("Could not update item quantity.");
    } finally {
      setUpdating(false);
    }
  };

  const handleRemove = async (productId) => {
    setUpdating(true);
    try {
      await cartService.removeCartItem(productId);
      setCartItems(items => items.filter(item => item.product_id !== productId));
    } catch (err) {
      alert("Could not remove item from cart.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-on-surface-variant">Retrieving your collection...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-32 px-4 text-center flex flex-col gap-4 items-center">
        <span className="material-symbols-outlined text-6xl text-error">error</span>
        <h1 className="text-3xl font-bold font-headline">Cart Error</h1>
        <p className="text-on-surface-variant max-w-sm">{error}</p>
        <button onClick={fetchCart} className="bg-primary text-white px-6 py-3 rounded-full font-bold mt-4">Retry</button>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20 px-4 md:px-8 max-w-screen-2xl mx-auto min-h-screen">
      <section className="mb-20">
        <div className="flex flex-col md:flex-row gap-12">
          {/* Left: Cart Items */}
          <div className="flex-grow space-y-8">
            <div className="flex items-end justify-between">
              <h1 className="text-4xl md:text-5xl font-black font-headline tracking-tighter text-on-surface">Your Library Cart</h1>
              <p className="text-on-surface-variant font-medium">{cartItems.length} Items Selected</p>
            </div>
            
            <div className={`space-y-4 ${updating ? 'opacity-50 pointer-events-none' : ''} transition-opacity duration-300`}>
              {cartItems.length === 0 ? (
                <div className="bg-surface-container-lowest p-12 rounded-xl text-center border border-outline-variant/10 shadow-sm flex flex-col items-center">
                  <span className="material-symbols-outlined text-6xl text-outline mb-4">shopping_cart</span>
                  <h2 className="text-2xl font-bold font-headline mb-2">Your cart is empty</h2>
                  <p className="text-on-surface-variant mb-6">Explore our curated selection to start building your library.</p>
                  <Link to="/shop" className="bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-primary-dim transition-colors">Start Browsing</Link>
                </div>
              ) : (
                cartItems.map((item) => {
                  const id = item.product_id;
                  const imgUrl = item.image_url || 'https://via.placeholder.com/150x200';
                  
                  return (
                    <div key={id} className="bg-surface-container-lowest p-6 rounded-lg flex flex-col sm:flex-row items-center gap-6 transition-all hover:shadow-[0px_24px_48px_-12px_rgba(74,64,224,0.08)] border border-outline-variant/5">
                      <div className="w-24 h-36 rounded-md overflow-hidden flex-shrink-0 bg-surface-container">
                        <Link to={`/product/${id}`}>
                           <img src={imgUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        </Link>
                      </div>
                      <div className="flex-grow w-full">
                        <div className="flex justify-between items-start">
                          <div>
                            <Link to={`/product/${id}`}>
                              <h3 className="text-xl font-bold font-headline text-on-surface hover:text-primary transition-colors">{item.title}</h3>
                            </Link>
                            <p className="text-on-surface-variant text-sm">by {item.authors || 'Author'}</p>
                          </div>
                          <button onClick={() => handleRemove(id)} className="text-outline-variant hover:text-error transition-colors p-2">
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-4 bg-surface-container-low px-4 py-2 rounded-full border border-outline-variant/10">
                            <button onClick={() => handleUpdate(id, item.quantity, -1)} className="text-primary hover:bg-white rounded-full p-1 transition-all"><span className="material-symbols-outlined text-sm">remove</span></button>
                            <span className="font-bold text-sm min-w-[1.5rem] text-center">{item.quantity}</span>
                            <button onClick={() => handleUpdate(id, item.quantity, 1)} className="text-primary hover:bg-white rounded-full p-1 transition-all"><span className="material-symbols-outlined text-sm">add</span></button>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-on-surface-variant uppercase tracking-widest font-bold">Subtotal</p>
                            <p className="text-xl font-black text-primary">${(item.unit_price * item.quantity).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Summary Card */}
          {cartItems.length > 0 && (
            <div className="w-full md:w-[400px] flex-shrink-0">
              <div className="bg-surface-container-low p-8 rounded-lg sticky top-32 border border-outline-variant/10">
                <h2 className="text-2xl font-black font-headline mb-8">Order Summary</h2>
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Subtotal</span>
                    <span className="font-bold text-on-surface">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Estimated Shipping</span>
                    <span className="font-bold text-on-surface">Free</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Taxes</span>
                    <span className="font-bold text-on-surface">${taxes.toFixed(2)}</span>
                  </div>
                  <div className="pt-4 border-t border-outline-variant/20 flex justify-between items-end">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-3xl font-black text-primary">${total.toFixed(2)}</span>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/checkout')}
                  className="w-full py-4 px-8 rounded-full bg-gradient-to-r from-primary to-primary-container text-white font-bold text-lg shadow-[0px_16px_32px_-8px_rgba(74,64,224,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  Proceed to Checkout
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
                <p className="mt-6 text-center text-xs text-on-surface-variant">Secure SSL Encrypted Checkout</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
