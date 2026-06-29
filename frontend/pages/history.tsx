import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useCart, Product } from '@/components/CartContext';
import { BottomNav } from '@/components/BottomNav';

interface HistoryOrderItem {
  id: number;
  productId: number;
  name: string;
  size: 'M' | 'L';
  sweetness: '0%' | '50%' | '100%';
  ice: '0%' | '50%' | '100%';
  note: string;
  quantity: number;
  singlePrice: number;
}

interface HistoryOrder {
  id: number;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  createdAt: string;
  items: HistoryOrderItem[];
}

export default function HistoryPage() {
  const router = useRouter();
  const { products, addToCart, clearCart, showToast, showDialog } = useCart();
  const [orders, setOrders] = useState<HistoryOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrderHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (e) {
      console.warn('Backend offline, failed to fetch order history.', e);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    showDialog(
      'Bạn có chắc chắn muốn xóa toàn bộ lịch sử đơn hàng trên hệ thống không?',
      async () => {
        try {
          const response = await fetch('http://localhost:5000/api/orders', {
            method: 'DELETE'
          });
          if (response.ok) {
            showToast('🗑️ Đã xóa sạch lịch sử đơn hàng!');
            setOrders([]);
          } else {
            showDialog('❌ Không thể xóa lịch sử đơn hàng.');
          }
        } catch (e) {
          console.warn('Error clearing history', e);
          showDialog('❌ Lỗi kết nối mạng, vui lòng thử lại.');
        }
      },
      true
    );
  };

  useEffect(() => {
    fetchOrderHistory();
  }, []);

  const handleReorder = (order: HistoryOrder) => {
    if (!order.items || order.items.length === 0) return;

    // 1. Clear existing cart
    clearCart();

    // 2. Add each item back into cart
    let addedCount = 0;
    for (const item of order.items) {
      // Find full product details from context products catalog
      const productDetail = products.find(p => p.id === item.productId);
      if (productDetail) {
        addToCart(
          productDetail, 
          item.size, 
          item.sweetness, 
          item.ice, 
          item.note, 
          item.quantity
        );
        addedCount++;
      }
    }

    if (addedCount > 0) {
      showToast(`🔄 Đã thêm lại ${addedCount} sản phẩm từ đơn hàng #${order.id} vào giỏ hàng!`);
      const groupRoom = router.query.groupRoom;
      if (groupRoom) {
        router.push(`/order?groupRoom=${groupRoom}`);
      } else {
        router.push('/order');
      }
    } else {
      showDialog('⚠️ Không thể thêm lại sản phẩm. Sản phẩm không còn tồn tại trong thực đơn.');
    }
  };

  // Format helper for MySQL datetimes
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      // adjust for local timezone if necessary
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="main-content" style={{ backgroundColor: '#FAF9F2', minHeight: '100vh', paddingBottom: '90px' }}>
      {/* Header */}
      <div className="page-header" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <button className="page-header-btn" onClick={() => {
          const groupRoom = router.query.groupRoom;
          if (groupRoom) {
            router.push(`/profile?groupRoom=${groupRoom}`);
          } else {
            router.push('/profile');
          }
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <div className="page-header-title">Lịch sử đặt đơn</div>
        <button 
          onClick={handleClearHistory}
          disabled={orders.length === 0}
          style={{
            background: 'none',
            border: 'none',
            color: orders.length === 0 ? 'var(--border-color)' : '#FF4D4F',
            fontSize: '13px',
            fontWeight: 600,
            cursor: orders.length === 0 ? 'not-allowed' : 'pointer',
            padding: '4px 8px',
          }}
        >
          Xóa
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', fontFamily: 'var(--font-sans)', color: 'var(--text-secondary)' }}>
          <p>Đang tải lịch sử đặt đơn...</p>
        </div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 24px', fontFamily: 'var(--font-sans)' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>☕</div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Bạn chưa đặt đơn hàng nào
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
            Hãy đặt món nước đầu tiên để bắt đầu hành trình tích lũy niềm vui!
          </p>
          <button 
            className="checkout-btn" 
            onClick={() => {
              const groupRoom = router.query.groupRoom;
              if (groupRoom) {
                router.push(`/?groupRoom=${groupRoom}`);
              } else {
                router.push('/');
              }
            }}
            style={{ margin: '0 auto' }}
          >
            Chọn món ngay
          </button>
        </div>
      ) : (
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px', fontFamily: 'var(--font-sans)' }}>
          {orders.map((order) => (
            <div 
              key={order.id} 
              style={{
                backgroundColor: 'var(--primary-light)',
                borderRadius: '20px',
                border: '1px solid var(--border-color)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              {/* Order Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>Đơn hàng #{order.id}</span>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {formatDate(order.createdAt)}
                  </div>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary-color)', backgroundColor: 'var(--white)', padding: '4px 10px', borderRadius: '10px' }}>
                  Đã hoàn thành
                </div>
              </div>

              {/* Order Items list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {order.items.map((item, idx) => {
                  const isFood = products.find(p => p.id === item.productId)?.category === 'Ngọt ngào';
                  const meta = isFood
                    ? [
                        item.size === 'L' ? 'Size L' : '',
                        item.note ? `"${item.note}"` : ''
                      ].filter(Boolean).join(', ')
                    : [
                        item.size === 'L' ? 'Size L' : '',
                        item.sweetness !== '100%' ? `${item.sweetness} Sugar` : '',
                        item.ice !== '100%' ? `${item.ice} Ice` : '',
                        item.note ? `"${item.note}"` : ''
                      ].filter(Boolean).join(', ');
                  
                  return (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 600 }}>{item.name}</span>
                        {meta && <span style={{ color: 'var(--text-secondary)', fontSize: '11px', marginLeft: '6px' }}>({meta})</span>}
                      </div>
                      <div style={{ color: 'var(--text-secondary)', marginLeft: '12px' }}>
                        x{item.quantity}
                      </div>
                      <div style={{ fontWeight: 500, marginLeft: '16px', minWidth: '60px', textAlign: 'right' }}>
                        {(item.singlePrice * item.quantity).toLocaleString('vi-VN')}đ
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Order Footer summary and Re-order button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border-color)', paddingTop: '12px', marginTop: '4px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Tổng thanh toán</span>
                  <div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--text-primary)', marginTop: '2px' }}>
                    {order.total.toLocaleString('vi-VN')}đ
                  </div>
                </div>
                <button 
                  onClick={() => handleReorder(order)}
                  style={{
                    backgroundColor: 'var(--primary-color)',
                    color: 'var(--white)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '8px 16px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                  </svg>
                  Đặt lại đơn này
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Navigation */}
      <BottomNav activeTab="profile" />
    </div>
  );
}
