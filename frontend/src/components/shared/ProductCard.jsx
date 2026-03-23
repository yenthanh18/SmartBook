import { Link } from 'react-router-dom';
import { trackSelectItem, trackAddToCart } from '../../services/analyticsService';
import { cartService } from '../../services/cartService';

export default function ProductCard({ product, listName = 'General List' }) {
  const handleClick = () => {
    trackSelectItem(product, listName);
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    trackAddToCart(product, 1);
    try {
      await cartService.addToCart(product.product_id, 1);
      alert(`Added ${product.title} to cart.`);
    } catch (err) {
      alert('Failed to add to cart');
    }
  };

  const id = product.product_id;
  const imgUrl = product.image_url || 'https://via.placeholder.com/300x400?text=No+Cover';
  const price = Number(product.final_price || 0);
  const rating = Number(product.average_rating || 0);

  return (
    <div className="group bg-surface-container-lowest rounded-lg p-5 transition-all duration-300 hover:shadow-[0px_24px_48px_-12px_rgba(74,64,224,0.08)] flex flex-col h-full">
      <div className="aspect-[3/4] rounded-md overflow-hidden bg-surface-container-low mb-6 relative">
        <Link to={`/product/${id}`} onClick={handleClick}>
          <img
            src={imgUrl}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </Link>

        {product.is_featured === 1 && (
          <div className="absolute top-3 left-3 bg-tertiary text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest shadow-lg">
            Featured
          </div>
        )}

        {product.is_bestseller === 1 && (
          <div className="absolute top-3 right-3 bg-error-container text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest shadow-lg">
            Bestseller
          </div>
        )}
      </div>

      <div className="space-y-1 flex flex-col flex-grow">
        <p className="text-xs font-bold text-primary uppercase tracking-widest">{product.category || 'Book'}</p>

        <Link to={`/product/${id}`} onClick={handleClick}>
          <h4 className="text-lg font-bold text-on-surface leading-tight group-hover:text-primary transition-colors cursor-pointer">
            {product.title}
          </h4>
        </Link>

        <p className="text-sm text-on-surface-variant mb-3 flex-grow">{product.authors || 'Unknown author'}</p>

        <div className="flex items-center gap-1 text-amber-400 mb-4 pt-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <span key={star} className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {star <= Math.floor(rating) ? 'star' : 'star_outline'}
            </span>
          ))}
          <span className="text-xs text-on-surface-variant font-medium ml-1">({rating.toFixed(1)})</span>
        </div>

        <div className="flex items-center justify-between pt-2 mt-auto">
          <div className="flex flex-col">
            <span className="text-xl font-black text-on-surface">${price.toFixed(2)}</span>
          </div>

          <button onClick={handleAddToCart} className="w-10 h-10 rounded-full bg-surface-container-high text-on-surface hover:bg-primary hover:text-white transition-all duration-300 flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
          </button>
        </div>
      </div>
    </div>
  );
}
