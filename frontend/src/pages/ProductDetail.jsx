import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { catalogService } from '../services/catalogService';
import { cartService } from '../services/cartService';
import { trackViewItem, trackAddToCart, trackClickRecommendation } from '../services/analyticsService';
import ProductCard from '../components/shared/ProductCard';
import { unwrapObject, unwrapList } from '../services/apiClient';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [sameAuthorBooks, setSameAuthorBooks] = useState([]);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      setRecommendations([]);
      setSameAuthorBooks([]);
      window.scrollTo(0, 0);

      try {
        const res = await catalogService.getProductById(id);
        const resolvedProduct = unwrapObject(res);
        setProduct(resolvedProduct);
        trackViewItem(resolvedProduct);

        if (resolvedProduct?.title) {
          catalogService
            .getRecommendations(resolvedProduct.title)
            .then((recRes) => {
              const recs = unwrapList(recRes).filter(
                (item) => String(item.product_id) !== String(resolvedProduct.product_id)
              );
              setRecommendations(recs);
            })
            .catch((err) => console.error('Recs failed', err));

          catalogService
            .getAuthorBooks(resolvedProduct.title)
            .then((authorRes) => {
              const books = unwrapList(authorRes).filter(
                (item) => String(item.product_id) !== String(resolvedProduct.product_id)
              );
              setSameAuthorBooks(books);
            })
            .catch((err) => console.error('Author recs failed', err));
        }
      } catch (_err) {
        setError('Could not find this intelligent piece of literature.');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;
    setAddingToCart(true);
    trackAddToCart(product, qty);
    try {
      await cartService.addToCart(product.product_id, qty);
      alert(`Added ${qty} of ${product.title} to your cart.`);
    } catch (_err) {
      alert('Failed to add to cart. Please check your connection.');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleRecClick = (recProduct, listName) => {
    trackClickRecommendation(recProduct, listName);
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen pt-32 px-4 text-center flex flex-col gap-4 items-center">
        <span className="material-symbols-outlined text-6xl text-outline">menu_book</span>
        <h1 className="text-3xl font-bold font-headline">Book Not Found</h1>
        <p className="text-on-surface-variant max-w-sm">{error}</p>
        <Link to="/shop" className="bg-primary text-white px-6 py-3 rounded-full font-bold mt-4">
          Browse Shop
        </Link>
      </div>
    );
  }

  const price = Number(product.final_price || 0);
  const imgUrl = product.image_url || 'https://via.placeholder.com/400x600?text=No+Cover';
  const reviewCount = Number(product.ratings_count || product.reviews || 0);
  const originalPrice = Number(product.price || 0);
  const hasDiscount = originalPrice > price;

  return (
    <div className="pt-24 px-4 md:px-8 max-w-screen-2xl mx-auto min-h-screen pb-20">
      <nav className="flex gap-2 text-sm text-on-surface-variant mb-8 font-medium">
        <Link to="/shop" className="hover:text-primary transition-colors">Shop</Link>
        <span className="material-symbols-outlined text-xs leading-none self-center">chevron_right</span>
        <span className="hover:text-primary transition-colors cursor-pointer">{product.category || 'Books'}</span>
        <span className="material-symbols-outlined text-xs leading-none self-center">chevron_right</span>
        <span className="text-on-surface line-clamp-1">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-surface-container-lowest rounded-lg p-12 shadow-[0px_24px_48px_-12px_rgba(74,64,224,0.08)] flex items-center justify-center aspect-[3/4]">
            <img src={imgUrl} alt={product.title} className="w-full h-full object-contain drop-shadow-2xl" />
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {product.is_bestseller ? (
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
                Bestseller
              </span>
            ) : null}
            {product.is_featured ? (
              <span className="bg-tertiary/10 text-tertiary px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
                AI Pick
              </span>
            ) : null}
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface leading-tight tracking-tighter mb-2 font-headline">
            {product.title}
          </h1>
          <p className="text-xl text-on-surface-variant font-medium mb-4 italic">
            {product.subtitle || 'A digitally curated masterpiece.'}
          </p>

          <div className="flex flex-wrap items-center gap-4 mb-8">
            <p className="text-on-surface-variant">
              by <span className="text-primary font-semibold">{product.authors || 'Unknown'}</span>
            </p>
            <div className="w-1 h-1 rounded-full bg-outline-variant"></div>
            <div className="flex items-center gap-1">
              <div className="flex text-amber-400">
                {[1, 2, 3, 4, 5].map((i) => {
                  const rating = Number(product.average_rating || 0);
                  return (
                    <span key={i} className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {i <= Math.floor(rating) ? 'star' : i - rating <= 0.5 && i - rating > 0 ? 'star_half' : 'star'}
                    </span>
                  );
                })}
              </div>
              <span className="text-sm font-bold text-on-surface">({reviewCount} Reviews)</span>
            </div>
          </div>

          <div className="flex items-baseline gap-4 mb-10 flex-wrap">
            <span className="text-4xl font-black text-on-surface font-headline">${price.toFixed(2)}</span>
            {hasDiscount ? (
              <span className="text-xl text-on-surface-variant line-through opacity-60">${originalPrice.toFixed(2)}</span>
            ) : null}
            {product.discount_percent ? (
              <span className="text-sm font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                Save {Math.round(Number(product.discount_percent))}%
              </span>
            ) : null}
          </div>

          <div className="bg-surface-container-low rounded-lg p-8 mb-8 space-y-6 border border-outline-variant/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`w-3 h-3 rounded-full ${product.availability_status === 'out_of_stock' ? 'bg-red-500' : 'bg-green-500'}`}></span>
                <span className="font-bold text-on-surface">
                  {product.availability_status === 'out_of_stock' ? 'Out of Stock' : 'In Stock'}
                </span>
                <span className="text-on-surface-variant text-sm ml-2">
                  {product.availability_status === 'out_of_stock'
                    ? 'Currently unavailable'
                    : 'Available for immediate shipping'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center bg-surface-container-lowest rounded-full border border-outline-variant/20 px-2 py-1">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 flex items-center justify-center text-on-surface hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">remove</span>
                </button>
                <span className="w-12 text-center font-bold text-lg">{qty}</span>
                <button onClick={() => setQty(Math.min(10, qty + 1))} className="w-10 h-10 flex items-center justify-center text-on-surface hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || product.availability_status === 'out_of_stock'}
                className="flex-grow md:flex-grow-0 md:px-12 py-4 rounded-full bg-gradient-to-r from-primary to-primary-container text-white font-bold text-lg shadow-[0px_12px_24px_-8px_rgba(74,64,224,0.4)] hover:scale-105 transition-transform active:scale-95 disabled:opacity-70 disabled:hover:scale-100 flex justify-center items-center gap-2"
              >
                {addingToCart ? <span className="material-symbols-outlined animate-spin">sync</span> : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-20 bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-outline-variant/10">
        <div className="flex border-b border-outline-variant/10 bg-surface-container-low">
          <button className="px-8 py-6 text-primary font-bold border-b-4 border-primary">Description</button>
        </div>
        <div className="p-8 md:p-12">
          <h3 className="text-2xl font-bold font-headline mb-4">Book Overview</h3>
          <p className="text-on-surface-variant leading-relaxed text-lg max-w-4xl whitespace-pre-wrap">
            {product.description ||
              'No description provided by the publisher. This intelligent work explores boundaries that challenge our conventional wisdom.'}
          </p>
        </div>
      </div>

      {recommendations.length > 0 && (
        <div className="mt-32">
          <h2 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight mb-8">
            AI Recommended Similar Reads
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {recommendations.slice(0, 4).map((rec) => (
              <div key={rec.product_id} onClick={() => handleRecClick(rec, 'product_page_similar')}>
                <ProductCard product={rec} listName="Similar Recommendations" />
              </div>
            ))}
          </div>
        </div>
      )}

      {sameAuthorBooks.length > 0 && (
        <div className="mt-20">
          <h2 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight mb-8">
            More from the same author
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {sameAuthorBooks.slice(0, 4).map((book) => (
              <div key={book.product_id} onClick={() => handleRecClick(book, 'product_page_same_author')}>
                <ProductCard product={book} listName="Same Author Recommendations" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
