// ============================================
// Admin Dashboard Page — Menu & Testimonials CMS
// ============================================
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, Settings, MessageSquare, PlusCircle, Edit3, Trash2,
  Plus, X, Star, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { SIZES } from '../data/products';
import { formatPrice } from '../utils/helpers';
import './AdminPage.css';

export default function AdminPage() {
  const {
    state,
    isAdmin,
    logout,
    addMenuProduct,
    updateMenuProduct,
    deleteMenuProduct,
    addCustomerTestimonial,
    updateCustomerTestimonial,
    deleteCustomerTestimonial,
  } = useStore();

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('products');

  // Guard: redirect non-admins to login
  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin/login', { replace: true });
    }
  }, [isAdmin, navigate]);

  if (!isAdmin) return null;

  const tabs = [
    { id: 'products', label: 'Menu Catalog', icon: <Settings size={18} /> },
    { id: 'testimonials', label: 'Customer Reviews', icon: <MessageSquare size={18} /> },
  ];

  return (
    <div className="admin-page" id="admin-page">
      <div className="container">
        {/* Header */}
        <div className="admin-header">
          <div>
            <h1 className="font-display">Store Dashboard</h1>
            <p>Welcome back, Priyanka 👩‍🍳 (Admin Portal)</p>
          </div>
          <button
            className="btn btn--ghost"
            onClick={logout}
            id="admin-logout-btn"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>

        {/* Stats */}
        <div className="admin-stats">
          <div className="admin-stat-card">
            <span className="admin-stat-card__icon">🎂</span>
            <div>
              <span className="admin-stat-card__number">{state.menuItems?.length || 0}</span>
              <span className="admin-stat-card__label">Menu Items</span>
            </div>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-card__icon">⭐</span>
            <div>
              <span className="admin-stat-card__number">{state.testimonials?.length || 0}</span>
              <span className="admin-stat-card__label">Reviews</span>
            </div>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-card__icon">✅</span>
            <div>
              <span className="admin-stat-card__number">
                {(state.menuItems || []).filter((p) => p.available !== false).length}
              </span>
              <span className="admin-stat-card__label">Available Items</span>
            </div>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-card__icon">👁️</span>
            <div>
              <span className="admin-stat-card__number">
                {(state.testimonials || []).filter((t) => t.visible !== false).length}
              </span>
              <span className="admin-stat-card__label">Visible Reviews</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              id={`admin-tab-${tab.id}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Menu Catalog Tab */}
        {activeTab === 'products' && (
          <MenuPanel
            menuItems={state.menuItems || []}
            onAdd={addMenuProduct}
            onUpdate={updateMenuProduct}
            onDelete={deleteMenuProduct}
          />
        )}

        {/* Testimonials Tab */}
        {activeTab === 'testimonials' && (
          <TestimonialsPanel
            testimonials={state.testimonials || []}
            onAdd={addCustomerTestimonial}
            onUpdate={updateCustomerTestimonial}
            onDelete={deleteCustomerTestimonial}
          />
        )}
      </div>
    </div>
  );
}

// ============================================
// 1. MENU CATALOG PANEL (CRUD)
// ============================================
function MenuPanel({ menuItems, onAdd, onUpdate, onDelete }) {
  const [editingItem, setEditingItem] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (isAdding || editingItem) {
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          setIsAdding(false);
          setEditingItem(null);
        }
      };
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isAdding, editingItem]);

  const getDefaultSizes = (category) => {
    const defaults = SIZES[category];
    if (defaults) {
      return defaults.map((s) => ({ label: s.label, serves: s.serves, multiplier: s.multiplier }));
    }
    return [{ label: '', serves: '', multiplier: 1 }];
  };

  const initialForm = {
    name: '',
    category: 'cakes',
    basePrice: '',
    description: '',
    image: '',
    flavors: '',
    sizes: getDefaultSizes('cakes'),
    eggless: true,
    available: true,
  };

  const [formData, setFormData] = useState(initialForm);

  const handleOpenAdd = () => {
    setFormData(initialForm);
    setIsAdding(true);
    setEditingItem(null);
  };

  const handleOpenEdit = (item) => {
    const existingSizes = Array.isArray(item.sizes) && item.sizes.length > 0
      ? item.sizes.map((s) => ({ label: s.label || '', serves: s.serves || '', multiplier: s.multiplier || 1 }))
      : getDefaultSizes(item.category || 'cakes');
    setFormData({
      name: item.name || '',
      category: item.category || 'cakes',
      basePrice: item.basePrice || '',
      description: item.description || '',
      image: item.image || '',
      flavors: Array.isArray(item.flavors) ? item.flavors.join(', ') : (item.flavors || ''),
      sizes: existingSizes,
      eggless: item.eggless !== false,
      available: item.available !== false,
    });
    setEditingItem(item);
    setIsAdding(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.basePrice) {
      alert('Please enter product name and base price');
      return;
    }

    const cleanedSizes = formData.sizes
      .filter((s) => s.label.trim())
      .map((s) => ({
        label: s.label.trim(),
        serves: s.serves.trim(),
        multiplier: Number(s.multiplier) || 1,
      }));

    const itemPayload = {
      name: formData.name.trim(),
      category: formData.category || 'cakes',
      basePrice: Number(formData.basePrice),
      description: formData.description.trim(),
      image: formData.image.trim() || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80',
      flavors: formData.flavors.split(',').map((f) => f.trim()).filter(Boolean),
      sizes: cleanedSizes.length > 0 ? cleanedSizes : getDefaultSizes(formData.category),
      available: formData.available,
      eggless: formData.eggless,
      isCustomizable: true,
      tags: formData.eggless ? ['veg'] : [],
      allergens: [],
      rating: 5.0,
      reviews: 1,
      leadTimeHours: 48,
    };

    if (editingItem) {
      await onUpdate(editingItem.id, itemPayload);
    } else {
      await onAdd(itemPayload);
    }

    setIsAdding(false);
    setEditingItem(null);
  };

  return (
    <div className="admin-panel" id="admin-menu-panel">
      <div className="admin-panel__action-bar">
        <div>
          <h3>Menu Catalog ({menuItems.length} Products)</h3>
          <p>Add, edit, change prices, or toggle availability for your cakes and desserts.</p>
        </div>
        <div>
          <button className="btn btn--primary" onClick={handleOpenAdd}>
            <PlusCircle size={18} />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {(isAdding || editingItem) && createPortal(
        <div
          className="admin-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsAdding(false);
              setEditingItem(null);
            }
          }}
        >
          <div className="admin-modal-card admin-modal-card--lg">
            <div className="admin-modal-header">
              <h3>{editingItem ? 'Edit Menu Product' : 'Add New Cake / Product'}</h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => {
                  setIsAdding(false);
                  setEditingItem(null);
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="admin-form">
              <div className="admin-modal-body">
                <div className="admin-form-grid admin-form-grid--3">
                  <div className="form-group">
                    <label>Product Name *</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Red Velvet Deluxe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Category</label>
                    <select
                      className="input-field"
                      value={formData.category}
                      onChange={(e) => {
                        const newCat = e.target.value;
                        setFormData({
                          ...formData,
                          category: newCat,
                          sizes: getDefaultSizes(newCat),
                        });
                      }}
                    >
                      <option value="cakes">Cakes</option>
                      <option value="cupcakes">Cupcakes</option>
                      <option value="brownies">Brownies</option>
                      <option value="seasonal">Seasonal</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Base Price (₹) *</label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="e.g. 500"
                      value={formData.basePrice}
                      onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Size / Quantity Specification */}
                <div className="form-group">
                  <label>Size / Quantity Options</label>
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-gray-500)', marginBottom: '8px' }}>
                    Define available sizes. Price = Base Price × Multiplier.
                  </p>
                  <div className="admin-sizes-list">
                    {formData.sizes.map((size, idx) => (
                      <div className="admin-size-row" key={idx}>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="Label (e.g. 1 kg)"
                          value={size.label}
                          onChange={(e) => {
                            const updated = [...formData.sizes];
                            updated[idx] = { ...updated[idx], label: e.target.value };
                            setFormData({ ...formData, sizes: updated });
                          }}
                        />
                        <input
                          type="text"
                          className="input-field"
                          placeholder="Serves (e.g. 8-10)"
                          value={size.serves}
                          onChange={(e) => {
                            const updated = [...formData.sizes];
                            updated[idx] = { ...updated[idx], serves: e.target.value };
                            setFormData({ ...formData, sizes: updated });
                          }}
                        />
                        <input
                          type="number"
                          className="input-field"
                          placeholder="Multiplier"
                          step="0.1"
                          min="0.1"
                          value={size.multiplier}
                          onChange={(e) => {
                            const updated = [...formData.sizes];
                            updated[idx] = { ...updated[idx], multiplier: e.target.value };
                            setFormData({ ...formData, sizes: updated });
                          }}
                        />
                        {formData.basePrice && (
                          <span className="admin-size-price">
                            {formatPrice(Math.round(Number(formData.basePrice) * Number(size.multiplier || 1)))}
                          </span>
                        )}
                        <button
                          type="button"
                          className="btn btn--sm btn--ghost admin-delete-btn"
                          onClick={() => {
                            const updated = formData.sizes.filter((_, i) => i !== idx);
                            setFormData({ ...formData, sizes: updated.length > 0 ? updated : [{ label: '', serves: '', multiplier: 1 }] });
                          }}
                          title="Remove size"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="btn btn--sm btn--outline"
                    style={{ marginTop: '8px' }}
                    onClick={() => setFormData({ ...formData, sizes: [...formData.sizes, { label: '', serves: '', multiplier: 1 }] })}
                  >
                    <Plus size={14} />
                    Add Size Option
                  </button>
                </div>

                <div className="admin-form-grid">
                  <div className="form-group">
                    <label>Flavors (Comma-separated)</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Chocolate, Vanilla, Strawberry"
                      value={formData.flavors}
                      onChange={(e) => setFormData({ ...formData, flavors: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Image URL</label>
                    <input
                      type="url"
                      className="input-field"
                      placeholder="https://images.unsplash.com/..."
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    />
                    {formData.image && (
                      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={formData.image}
                          alt="Preview"
                          style={{
                            width: '44px',
                            height: '44px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '1px solid var(--color-gray-200)'
                          }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <span style={{ fontSize: '0.78rem', color: 'var(--color-gray-500)' }}>
                          Preview OK
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    className="input-field"
                    rows={2}
                    placeholder="Describe your delicious creation..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="admin-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.eggless}
                      onChange={(e) => setFormData({ ...formData, eggless: e.target.checked })}
                    />
                    <span>🟢 Eggless Option Available</span>
                  </label>
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-gray-500)', marginTop: '4px' }}>
                    Check this if this product is available in an eggless / pure veg preparation.
                  </p>
                </div>
              </div>

              <div className="admin-form-actions">
                <button
                  type="button"
                  className="btn btn--outline"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingItem(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary">
                  {editingItem ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Product List */}
      {menuItems.length === 0 ? (
        <div className="admin-empty">
          <p>No products in the catalog yet. Click "Add New Product" to add your first item!</p>
        </div>
      ) : (
        <div className="admin-menu-list">
          {menuItems.map((product) => {
            const isAvailable = product.available !== false;
            return (
              <div className="admin-menu-item" key={product.id} id={`admin-product-${product.id}`}>
                <div className="admin-menu-item__info">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="admin-menu-item__thumb" />
                  ) : (
                    <span className="admin-menu-item__emoji">
                      {product.category === 'cakes' ? '🎂' : product.category === 'cupcakes' ? '🧁' : product.category === 'brownies' ? '🍫' : '🎉'}
                    </span>
                  )}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="admin-menu-item__name">{product.name}</span>
                      <span className="admin-category-badge">{product.category}</span>
                    </div>
                    <span className="admin-menu-item__price">Price: {formatPrice(product.basePrice)}</span>
                  </div>
                </div>

                <div className="admin-menu-item__actions">
                  <button
                    className={`admin-toggle ${isAvailable ? 'active' : ''}`}
                    onClick={() => onUpdate(product.id, { available: !isAvailable })}
                    title={isAvailable ? 'Click to mark Out of Stock' : 'Click to mark In Stock'}
                  >
                    {isAvailable ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                    <span className="admin-toggle__label">{isAvailable ? 'In Stock' : 'Out of Stock'}</span>
                  </button>

                  <button
                    className="btn btn--sm btn--outline"
                    onClick={() => handleOpenEdit(product)}
                    title="Edit product"
                  >
                    <Edit3 size={15} />
                    <span>Edit</span>
                  </button>

                  <button
                    className="btn btn--sm btn--ghost admin-delete-btn"
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
                        onDelete(product.id);
                      }
                    }}
                    title="Delete product"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================
// 2. TESTIMONIALS PANEL (CRUD)
// ============================================
function TestimonialsPanel({ testimonials, onAdd, onUpdate, onDelete }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    if (isAdding || editingItem) {
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          setIsAdding(false);
          setEditingItem(null);
        }
      };
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isAdding, editingItem]);

  const initialForm = {
    name: '',
    item: '',
    rating: 5,
    text: '',
    visible: true,
  };

  const [formData, setFormData] = useState(initialForm);

  const handleOpenAdd = () => {
    setFormData(initialForm);
    setIsAdding(true);
    setEditingItem(null);
  };

  const handleOpenEdit = (item) => {
    setFormData({
      name: item.name || '',
      item: item.item || '',
      rating: item.rating || 5,
      text: item.text || '',
      visible: item.visible !== false,
    });
    setEditingItem(item);
    setIsAdding(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.text.trim()) {
      alert('Please enter reviewer name and feedback text');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      item: formData.item.trim(),
      rating: Number(formData.rating) || 5,
      text: formData.text.trim(),
      visible: formData.visible,
    };

    if (editingItem) {
      await onUpdate(editingItem.id, payload);
    } else {
      await onAdd(payload);
    }

    setIsAdding(false);
    setEditingItem(null);
  };

  return (
    <div className="admin-panel" id="admin-testimonials-panel">
      <div className="admin-panel__action-bar">
        <div>
          <h3>Customer Testimonials ({testimonials.length} Reviews)</h3>
          <p>Manage customer reviews shown on the website home page carousel.</p>
        </div>
        <button className="btn btn--primary" onClick={handleOpenAdd}>
          <PlusCircle size={18} />
          <span>Add Testimonial</span>
        </button>
      </div>

      {/* Add / Edit Modal */}
      {(isAdding || editingItem) && createPortal(
        <div
          className="admin-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsAdding(false);
              setEditingItem(null);
            }
          }}
        >
          <div className="admin-modal-card">
            <div className="admin-modal-header">
              <h3>{editingItem ? 'Edit Testimonial' : 'Add New Testimonial'}</h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => {
                  setIsAdding(false);
                  setEditingItem(null);
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="admin-form">
              <div className="admin-modal-body">
                <div className="admin-form-grid">
                  <div className="form-group">
                    <label>Customer Name *</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Rahul S."
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Product Ordered</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Belgian Chocolate Truffle"
                      value={formData.item}
                      onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Rating (1 to 5 Stars)</label>
                    <select
                      className="input-field"
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                    >
                      <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
                      <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
                      <option value="3">⭐⭐⭐ (3 Stars)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Review / Feedback *</label>
                  <textarea
                    className="input-field"
                    rows={4}
                    placeholder="What did the customer say about the cake?"
                    value={formData.text}
                    onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="admin-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.visible}
                      onChange={(e) => setFormData({ ...formData, visible: e.target.checked })}
                    />
                    <span>👁️ Visible on website</span>
                  </label>
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-gray-500)', marginTop: '4px' }}>
                    Uncheck to hide this review from the public carousel.
                  </p>
                </div>
              </div>

              <div className="admin-form-actions">
                <button
                  type="button"
                  className="btn btn--outline"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingItem(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary">
                  {editingItem ? 'Save Changes' : 'Add Review'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Testimonials List */}
      {testimonials.length === 0 ? (
        <div className="admin-empty">
          <p>No customer reviews yet. Click "Add Testimonial" to add one.</p>
        </div>
      ) : (
        <div className="admin-testimonials-grid">
          {testimonials.map((t) => (
            <div className="admin-test-card" key={t.id}>
              <div className="admin-test-card__header">
                <div>
                  <strong>{t.name}</strong>
                  {t.item && <span className="admin-test-card__item">Ordered: {t.item}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="admin-test-card__stars">
                    {Array.from({ length: Number(t.rating) || 5 }).map((_, i) => (
                      <Star key={i} size={14} fill="var(--color-gold)" stroke="var(--color-gold)" />
                    ))}
                  </div>
                  {/* Visible toggle */}
                  <button
                    className={`admin-toggle admin-toggle--sm ${t.visible !== false ? 'active' : ''}`}
                    onClick={() => onUpdate(t.id, { visible: t.visible === false ? true : false })}
                    title={t.visible !== false ? 'Click to hide from website' : 'Click to show on website'}
                    style={{ fontSize: '0.75rem' }}
                  >
                    {t.visible !== false ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                    <span className="admin-toggle__label" style={{ fontSize: '0.72rem' }}>
                      {t.visible !== false ? 'Visible' : 'Hidden'}
                    </span>
                  </button>
                </div>
              </div>

              <p className="admin-test-card__text">"{t.text}"</p>

              <div className="admin-test-card__footer">
                <button
                  className="btn btn--sm btn--outline"
                  onClick={() => handleOpenEdit(t)}
                >
                  <Edit3 size={14} />
                  <span>Edit</span>
                </button>
                <button
                  className="btn btn--sm btn--ghost admin-delete-btn"
                  onClick={() => {
                    if (window.confirm(`Delete review from ${t.name}?`)) {
                      onDelete(t.id);
                    }
                  }}
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
