import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useCart, Product } from '@/components/CartContext';

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { products, addToCart, toggleFavorite, isFavorite, zaloUser, showToast, showDialog } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [size, setSize] = useState<'M' | 'L'>('M');
  const [sweetness, setSweetness] = useState<'0%' | '50%' | '100%'>('50%');
  const [ice, setIce] = useState<'0%' | '50%' | '100%'>('100%');
  const [tempOption, setTempOption] = useState<'Hâm nóng' | 'Không hâm nóng'>('Hâm nóng');
  const [servingOption, setServingOption] = useState<'Dùng tại quán' | 'Mang đi'>('Dùng tại quán');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (id && products.length > 0) {
      const foundProduct = products.find(p => p.id === Number(id));
      if (foundProduct) {
        setProduct(foundProduct);
      }
    }
  }, [id, products]);

  if (!product) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#FAF9F2' }}>
        <p style={{ fontFamily: 'var(--font-sans)', color: 'var(--text-secondary)' }}>Đang tải sản phẩm...</p>
      </div>
    );
  }

  const basePrice = product.price;
  const currentPrice = (product.category === 'Ngọt ngào' || size === 'M') ? basePrice : basePrice + 10000;
  const groupRoom = router.query.groupRoom as string;

  const handleAddToCart = async () => {
    // If food item, set the note to warming choice and serving choice, plus any custom user note
    const finalNote = product.category === 'Ngọt ngào'
      ? [
          tempOption === 'Hâm nóng' ? 'Warmed up' : 'No warming',
          servingOption === 'Mang đi' ? 'Takeaway' : 'Dine-in',
          note.trim()
        ].filter(Boolean).join(', ')
      : note.trim();

    const finalSize = product.category === 'Ngọt ngào' ? 'M' : size;
    const finalSweetness = product.category === 'Ngọt ngào' ? '100%' : sweetness;
    const finalIce = product.category === 'Ngọt ngào' ? '100%' : ice;
    const finalPrice = product.category === 'Ngọt ngào' ? product.price : (size === 'L' ? product.price + 10000 : product.price);

    if (groupRoom) {
      try {
        const response = await fetch(`http://localhost:5000/api/group-orders/${groupRoom}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userName: zaloUser.name,
            productId: product.id,
            name: product.name,
            size: finalSize,
            sweetness: finalSweetness,
            ice: finalIce,
            note: finalNote,
            quantity: 1,
            singlePrice: finalPrice
          })
        });
        if (response.ok) {
          showToast(`Đã thêm vào đơn nhóm ROOM!`);
          setTimeout(() => {
            router.push(`/?groupRoom=${groupRoom}`);
          }, 1500);
        } else {
          showDialog('❌ Không thể thêm món vào đơn nhóm. Có thể nhóm đã đóng.');
        }
      } catch (e) {
        console.error('Error posting to group order room', e);
        showDialog('❌ Lỗi kết nối mạng, vui lòng thử lại.');
      }
    } else {
      addToCart(product, finalSize, finalSweetness, finalIce, finalNote, 1);
      showToast('✅ Đã thêm vào giỏ hàng!');
      setTimeout(() => {
        router.push('/');
      }, 1500);
    }
  };

  return (
    <div className="main-content" style={{ backgroundColor: '#FAF9F2', paddingBottom: '100px' }}>
      {/* Product Image Banner */}
      <div className="detail-header">
        <img src={product.image} alt={product.name} className="detail-hero-image" />
        <div className="nav-actions">
          <button className="action-circle" onClick={() => router.back()}>
            ←
          </button>
          <button 
            className="action-circle"
            onClick={() => toggleFavorite(product.id)}
            style={{ 
              color: isFavorite(product.id) ? '#E05C5C' : 'var(--text-primary)',
              transition: 'all 0.2s ease'
            }}
          >
            ♥
          </button>
        </div>
        {product.isBestSeller && (
          <div className="badge-best-seller">BÁN CHẠY</div>
        )}
      </div>

      {/* Product Info */}
      <div className="detail-info">
        <div className="detail-title-row">
          <h1 className="detail-title">{product.name}</h1>
          <div className="detail-price">{product.price.toLocaleString('vi-VN')}đ</div>
        </div>
        <p className="detail-desc">{product.description}</p>

        {/* Option 1: Size (Only for drinks) */}
        {product.category !== 'Ngọt ngào' ? (
          <PremiumSlider 
            value={size}
            options={['M', 'L'] as const}
            labels={{ M: 'Vừa (Size M)', L: '+10.000đ (Size L)' }}
            onChange={(val) => setSize(val)}
            labelText="Kích cỡ"
          />
        ) : (
          <PremiumSlider 
            value={servingOption}
            options={['Dùng tại quán', 'Mang đi'] as const}
            labels={{ 'Dùng tại quán': 'Dùng tại quán', 'Mang đi': 'Mang đi (Đóng túi giấy)' }}
            onChange={(val) => setServingOption(val)}
            labelText="Cách phục vụ"
          />
        )}

        {/* Option 2 & 3: Drink options (Sweetness/Ice) vs Food Options (Warmed up) */}
        {product.category === 'Ngọt ngào' ? (
          <PremiumSlider 
            value={tempOption}
            options={['Hâm nóng', 'Không hâm nóng'] as const}
            labels={{ 'Hâm nóng': 'Hâm nóng (Warmed up)', 'Không hâm nóng': 'Không hâm nóng (No warming)' }}
            onChange={(val) => setTempOption(val)}
            labelText="Hâm nóng"
          />
        ) : (
          <>
            <PremiumSlider 
              value={sweetness}
              options={['0%', '50%', '100%'] as const}
              labels={{ '0%': 'Không đường (0%)', '50%': 'Ngọt vừa (50%)', '100%': 'Bình thường (100%)' }}
              onChange={(val) => setSweetness(val)}
              labelText="Độ ngọt"
            />

            <PremiumSlider 
              value={ice}
              options={['0%', '50%', '100%'] as const}
              labels={{ '0%': 'Không đá (0%)', '50%': 'Đá vừa (50%)', '100%': 'Bình thường (100%)' }}
              onChange={(val) => setIce(val)}
              labelText="Lượng đá"
            />
          </>
        )}

        {/* Option 4: Note */}
        <div className="option-section">
          <div className="option-label">Ghi chú thêm</div>
          <textarea 
            className="note-textarea"
            placeholder={product.category === 'Ngọt ngào' ? "Thêm yêu cầu hâm nóng..." : "Thêm thạch, ít trân châu..."}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </div>

      {/* Sticky Bottom Bar - Matching design exactly */}
      <div className="checkout-footer" style={{ padding: '16px 20px calc(16px + env(safe-area-inset-bottom, 12px)) 20px' }}>
        <button 
          className="checkout-btn" 
          onClick={handleAddToCart}
          style={{ 
            width: '100%', 
            justifyContent: 'center', 
            borderRadius: '16px',
            padding: '16px',
            fontSize: '16px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
            <path d="M3 6h18"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          {groupRoom ? `Thêm vào đơn nhóm - ${currentPrice.toLocaleString('vi-VN')}đ` : `Thêm vào giỏ hàng - ${currentPrice.toLocaleString('vi-VN')}đ`}
        </button>
      </div>


    </div>
  );
}

/* Custom horizontal draggable range slider component */
interface PremiumSliderProps<T extends string> {
  value: T;
  options: readonly T[];
  labels: { [key in T]: string };
  onChange: (value: T) => void;
  labelText: string;
}

const PremiumSlider = <T extends string>({ 
  value, 
  options, 
  labels, 
  onChange, 
  labelText 
}: PremiumSliderProps<T>) => {
  const currentIndex = options.indexOf(value);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.value, 10);
    if (index >= 0 && index < options.length) {
      onChange(options[index]);
    }
  };

  return (
    <div className="slider-container" style={{ backgroundColor: 'var(--white)', borderRadius: '20px', padding: '16px 20px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)', marginBottom: '24px' }}>
      <div className="slider-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>
          {labelText}
        </span>
        <span className="slider-badge" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--text-primary)', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600 }}>
          {labels[value] || value}
        </span>
      </div>
      <div style={{ position: 'relative', width: '100%', height: '36px', display: 'flex', alignItems: 'center' }}>
        {/* Custom Track Background */}
        <div style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: '6px',
          backgroundColor: 'var(--primary-light)',
          borderRadius: '3px',
          zIndex: 1
        }} />
        
        {/* Custom Filled Track */}
        <div style={{
          position: 'absolute',
          left: 0,
          width: `${(currentIndex / (options.length - 1)) * 100}%`,
          height: '6px',
          backgroundColor: 'var(--primary-color)',
          borderRadius: '3px',
          zIndex: 2,
          transition: 'width 0.15s ease-out'
        }} />

        {/* Step Markers */}
        <div style={{
          position: 'absolute',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-between',
          zIndex: 3,
          pointerEvents: 'none'
        }}>
          {options.map((_, idx) => (
            <div 
              key={idx}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: idx <= currentIndex ? 'var(--primary-color)' : 'var(--border-color)',
                border: '2px solid #FFFFFF',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                transition: 'background-color 0.15s ease-out'
              }}
            />
          ))}
        </div>

        {/* Native Transparent Slider overlay */}
        <input 
          type="range"
          min="0"
          max={options.length - 1}
          value={currentIndex}
          onChange={handleSliderChange}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: 'pointer',
            zIndex: 4,
            margin: 0
          }}
        />

        {/* Custom Slider Thumb */}
        <div style={{
          position: 'absolute',
          left: `calc(${(currentIndex / (options.length - 1)) * 100}% - 14px)`,
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          backgroundColor: '#FFFFFF',
          border: '6px solid var(--primary-color)',
          boxShadow: '0 3px 8px rgba(0, 0, 0, 0.2)',
          zIndex: 5,
          pointerEvents: 'none',
          transition: 'left 0.15s ease-out'
        }} />
      </div>

      {/* Tick Labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', padding: '0 2px' }}>
        {options.map((opt) => (
          <span 
            key={opt}
            onClick={() => onChange(opt)}
            style={{
              fontSize: '12px',
              color: value === opt ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: value === opt ? 600 : 400,
              cursor: 'pointer'
            }}
          >
            {opt}
          </span>
        ))}
      </div>
    </div>
  );
};


