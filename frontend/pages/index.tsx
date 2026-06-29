import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useCart, Product } from '@/components/CartContext';
import { BottomNav } from '@/components/BottomNav';
import { Sidebar } from '@/components/Sidebar';

export default function Home() {
  const router = useRouter();
  const { products, addToCart, cart, activeStore, isFavorite, zaloUser, loyaltyPoints, showToast, showDialog } = useCart();
  const [selectedCategory, setSelectedCategory] = useState('Signature');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentBanner, setCurrentBanner] = useState(0);

  const banners = [
    {
      id: 'spin',
      badge: 'Minigame',
      title: 'Vòng quay may mắn 🎡',
      desc: 'Sử dụng 20★ đổi lượt quay trúng Voucher đến 50k hoặc điểm thưởng!',
      actionText: 'Quay ngay',
      color: 'linear-gradient(135deg, #8C7B53 0%, #5E5842 100%)',
      icon: '🎡',
      link: '/profile?openSpin=true'
    },
    {
      id: 'voucher',
      badge: 'Khuyến mãi',
      title: 'Mưa Voucher hè này 🎫',
      desc: 'Mở ví Voucher đổi điểm vàng hoặc sử dụng SERENE15 giảm 15k đơn từ 100k!',
      actionText: 'Xem ví',
      color: 'linear-gradient(135deg, #B99D6B 0%, #8C7B53 100%)',
      icon: '🎫',
      link: '/profile?openVouchers=true'
    },
    {
      id: 'lotus',
      badge: 'Món mới',
      title: 'Trà Sen Tây Hồ Tĩnh Lặng 🪷',
      desc: 'Hương sen dịu dàng ướp tinh tế trong từng lá trà xanh thanh mát, thử ngay chỉ 50k!',
      actionText: 'Thử ngay',
      color: 'linear-gradient(135deg, #7D8E74 0%, #556B4D 100%)',
      icon: '🪷',
      action: () => setSelectedCategory('Thanh lọc cơ thể')
    }
  ];

  // Auto slide banners
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const getMemberRank = (pts: number) => {
    if (pts >= 300) return 'Hạng Vàng (Gold)';
    if (pts >= 100) return 'Hạng Bạc (Silver)';
    return 'Hạng Đồng (Bronze)';
  };

  // Handle category selection change from navigation query
  useEffect(() => {
    if (router.query.tab) {
      setSelectedCategory(router.query.tab as string);
    } else {
      setSelectedCategory('Signature');
    }
  }, [router.query.tab]);

  const categories = ['Tất cả', 'Signature', 'Thanh lọc cơ thể', 'Ngọt ngào', 'Yêu thích'];

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    
    if (selectedCategory === 'Yêu thích') {
      return isFavorite(product.id);
    }
    return selectedCategory === 'Tất cả' || product.category === selectedCategory;
  });

  const handleProductClick = (id: number) => {
    const groupRoom = router.query.groupRoom;
    if (groupRoom) {
      router.push(`/product/${id}?groupRoom=${groupRoom}`);
    } else {
      router.push(`/product/${id}`);
    }
  };

  const handleQuickAdd = async (e: React.MouseEvent, product: Product) => {
    e.stopPropagation(); // Prevent navigating to detail page
    const groupRoom = router.query.groupRoom;
    if (groupRoom) {
      try {
        const response = await fetch(`http://localhost:5000/api/group-orders/${groupRoom}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userName: zaloUser.name,
            productId: product.id,
            name: product.name,
            size: 'M',
            sweetness: '50%',
            ice: '100%',
            note: '',
            quantity: 1,
            singlePrice: product.price
          })
        });
        if (response.ok) {
          showToast(`Đã thêm ${product.name} vào đơn nhóm!`);
        } else {
          showDialog('❌ Không thể thêm món vào đơn nhóm. Có thể nhóm đã đóng.');
        }
      } catch (err) {
        console.error('Error quick adding to group', err);
        showDialog('❌ Lỗi kết nối mạng.');
      }
    } else {
      addToCart(product, 'M', '50%', '100%', '', 1);
      showToast(`Đã thêm ${product.name} vào giỏ hàng!`);
    }
  };

  const cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <div className="main-content" style={{ backgroundColor: '#FAF9F2', minHeight: '100vh' }}>
      {/* Header */}
      <div className="page-header" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <button className="page-header-btn" style={{ fontSize: '24px' }} onClick={() => setIsSidebarOpen(true)}>☰</button>
        <div className="page-header-title" style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '16px' }}>
          Serene Brews - {activeStore}
        </div>
        <button 
          className="page-header-btn" 
          style={{ position: 'relative', fontSize: '24px' }}
          onClick={() => {
            const groupRoom = router.query.groupRoom;
            if (groupRoom) {
              router.push(`/order?groupRoom=${groupRoom}`);
            } else {
              router.push('/order');
            }
          }}
        >
          👜
          {cartItemCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-6px',
                backgroundColor: 'var(--primary-color)',
                color: 'white',
                borderRadius: '50%',
                width: '16px',
                height: '16px',
                fontSize: '9px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold'
              }}
            >
              {cartItemCount}
            </span>
          )}
        </button>
      </div>

      {/* User Greeting & Member Card */}
      <div className="member-greeting-container">
        <div className="member-greeting-left">
          {zaloUser.avatar ? (
            <img 
              src={zaloUser.avatar} 
              alt={zaloUser.name} 
              className="member-greeting-avatar" 
            />
          ) : (
            <div 
              className="member-greeting-avatar" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                backgroundColor: 'var(--primary-light)', 
                color: 'var(--primary-color)', 
                fontWeight: 'bold',
                fontSize: '18px'
              }}
            >
              {zaloUser.name ? zaloUser.name.charAt(0).toUpperCase() : 'S'}
            </div>
          )}
          <div style={{ textAlign: 'left' }}>
            <div className="member-greeting-hello">Chào buổi sáng,</div>
            <div className="member-greeting-name">{zaloUser.name} 👋</div>
          </div>
        </div>
        <div className="member-greeting-right" onClick={() => router.push('/profile')} style={{ cursor: 'pointer' }}>
          <div className="member-greeting-points">★ {loyaltyPoints}đ</div>
          <div className="member-greeting-rank">{getMemberRank(loyaltyPoints)}</div>
        </div>
      </div>

      {/* Banner Carousel Slider */}
      <div className="banner-slider-wrapper">
        <div className="banner-slider-container">
          {banners.map((b, idx) => {
            const isActive = currentBanner === idx;
            
            const handleBannerClick = (e: React.MouseEvent) => {
              if (b.action) {
                e.preventDefault();
                b.action();
              } else if (b.link) {
                e.preventDefault();
                router.push(b.link);
              }
            };

            return (
              <div 
                key={b.id} 
                className={`banner-slide ${isActive ? 'active' : ''}`}
                style={{ background: b.color, cursor: 'pointer' }}
                onClick={handleBannerClick}
              >
                <div className="banner-slide-content">
                  <span className="banner-slide-badge">{b.badge}</span>
                  <h3 className="banner-slide-title">{b.title}</h3>
                  <p className="banner-slide-desc">{b.desc}</p>
                </div>
                <div className="banner-slide-image-container">
                  {b.icon}
                </div>
                <div className="banner-slide-overlay" />
              </div>
            );
          })}
        </div>
        {/* Indicators */}
        <div className="banner-indicators">
          {banners.map((_, idx) => (
            <div 
              key={idx 
              } 
              className={`banner-dot ${currentBanner === idx ? 'active' : ''}`}
              onClick={() => setCurrentBanner(idx)}
            />
          ))}
        </div>
      </div>

      {/* Live Search Bar */}
      <div style={{ padding: '16px 20px 0 20px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span style={{ position: 'absolute', left: '16px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
          <input
            type="text"
            placeholder="Tìm món ngon tại Serene Brews..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 42px',
              borderRadius: '25px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--white)',
              outline: 'none',
              fontSize: '14px',
              fontFamily: 'var(--font-sans)',
              color: 'var(--text-primary)'
            }}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              style={{ 
                position: 'absolute', 
                right: '16px', 
                border: 'none', 
                background: 'none', 
                color: 'var(--text-secondary)', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Group Ordering Banner/Action */}
      <div style={{ padding: '12px 20px 0 20px' }}>
        {router.query.groupRoom ? (
          <div style={{
            backgroundColor: 'rgba(94, 88, 66, 0.08)',
            border: '1px dashed var(--primary-color)',
            borderRadius: '16px',
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontFamily: 'var(--font-sans)'
          }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary-color)' }}>
                👥 Đang tham gia đơn nhóm
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                Mã phòng: {router.query.groupRoom}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/?groupRoom=${router.query.groupRoom}`);
                  showToast('📋 Đã sao chép link mời bạn bè!');
                }}
                style={{
                  backgroundColor: 'var(--primary-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Chia sẻ
              </button>
              <button 
                onClick={() => {
                  router.push('/');
                }}
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Rời nhóm
              </button>
            </div>
          </div>
        ) : (
          <div style={{
            background: 'linear-gradient(135deg, #FAF4E8 0%, #F5EADB 100%)',
            border: '1px solid rgba(224, 204, 172, 0.4)',
            borderRadius: '16px',
            padding: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontFamily: 'var(--font-sans)',
            boxShadow: '0 4px 15px rgba(94, 88, 66, 0.05)'
          }}>
            <div style={{ flex: 1, paddingRight: '12px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                👥 Đặt nước chung cùng đồng nghiệp?
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: '1.4' }}>
                Tạo nhóm đặt đơn, chia sẻ link để bạn bè tự chọn món và thanh toán một lần tiện lợi!
              </p>
            </div>
            <button
              onClick={async () => {
                try {
                  const res = await fetch('http://localhost:5000/api/group-orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ creatorName: zaloUser.name })
                  });
                  if (res.ok) {
                    const data = await res.json();
                     if (data && data.roomId) {
                      router.push(`/?groupRoom=${data.roomId}`);
                      showToast('🎉 Đã tạo đơn nhóm thành công!');
                    }
                  }
                } catch (e) {
                  console.error('Failed to create group order', e);
                  showDialog('Lỗi kết nối máy chủ.');
                }
              }}
              style={{
                backgroundColor: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(94, 88, 66, 0.15)',
                whiteSpace: 'nowrap'
              }}
            >
              Tạo nhóm
            </button>
          </div>
        )}
      </div>

      {/* Category Pills */}
      <div className="category-container">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="product-grid">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="product-card"
            onClick={() => handleProductClick(product.id)}
          >
            <div className="product-image-wrapper">
              <img
                src={product.image}
                alt={product.name}
                className="product-image"
              />
              <button
                className="add-btn"
                onClick={(e) => handleQuickAdd(e, product)}
              >
                +
              </button>
            </div>
            <div className="product-title">{product.name}</div>
            <div className="product-price">{product.price.toLocaleString('vi-VN')}đ</div>
          </div>
        ))}
      </div>



      {/* Navigation */}
      <BottomNav activeTab="home" />

      {/* Sidebar Drawer */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </div>
  );
}
