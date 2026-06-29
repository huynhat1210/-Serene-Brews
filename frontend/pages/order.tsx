import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useCart } from '@/components/CartContext';
import { BottomNav } from '@/components/BottomNav';

export default function OrderPage() {
  const router = useRouter();
  const { 
    products,
    cart, 
    updateQuantity, 
    subtotal, 
    discount, 
    total, 
    clearCart,
    selectedVoucher,
    availableVouchers,
    applyVoucher,
    removeVoucher,
    loyaltyPoints,
    addPoints,
    spendPoints,
    unlockedVouchers,
    zaloUser,
    setHasUnreadNotifications,
    showToast,
    showDialog
  } = useCart();
  
  const [paymentMethod, setPaymentMethod] = useState<'ZaloPay' | 'Cash'>('ZaloPay');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderStatus, setOrderStatus] = useState<'cart' | 'success'>('cart');
  const [successOrderData, setSuccessOrderData] = useState<any>(null);

  // Delivery & Address selection states
  interface Address {
    id: string;
    tag: string;
    detail: string;
  }
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [isAddressDrawerOpen, setIsAddressDrawerOpen] = useState(false);
  const [tempAddressTag, setTempAddressTag] = useState('');
  const [tempAddressDetail, setTempAddressDetail] = useState('');

  // Load addresses from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('serene_saved_addresses');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSavedAddresses(parsed);
        if (parsed.length > 0) {
          setSelectedAddress(parsed[0]);
        }
      }
    }
  }, []);

  const handleAddAddressCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempAddressTag.trim() || !tempAddressDetail.trim()) return;
    const newAddr: Address = {
      id: Date.now().toString(),
      tag: tempAddressTag.trim(),
      detail: tempAddressDetail.trim()
    };
    const updated = [...savedAddresses, newAddr];
    setSavedAddresses(updated);
    localStorage.setItem('serene_saved_addresses', JSON.stringify(updated));
    setSelectedAddress(newAddr);
    setTempAddressTag('');
    setTempAddressDetail('');
    setIsAddressDrawerOpen(false);
  };

  
  // ZaloPay QR checkout states
  const [showQRModal, setShowQRModal] = useState(false);
  const [countdown, setCountdown] = useState(300);

  // Voucher selector states
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [voucherInput, setVoucherInput] = useState('');
  const [voucherInputError, setVoucherInputError] = useState('');

  // Group Room states
  const [groupRoomData, setGroupRoomData] = useState<any>(null);
  const groupRoom = router.query.groupRoom as string;
  const isGroupActive = !!groupRoom;

  const pushOrderNotification = (orderId: number, totalAmount: number) => {
    if (typeof window !== 'undefined') {
      const savedNotify = localStorage.getItem('serene_notifications_list');
      let currentList: any[] = [];
      if (savedNotify) {
        try {
          currentList = JSON.parse(savedNotify);
        } catch (e) {
          console.error(e);
        }
      }
      
      if (currentList.length === 0) {
        currentList = [
          {
            id: 1,
            title: '🎁 Quà tặng thành viên mới',
            body: 'Chào mừng bạn đến với Serene Brews! Mã giảm giá SERENE15 đã được mở khóa tự động trong ví voucher của bạn.',
            time: 'Vừa xong',
            type: 'promo',
            unread: true
          },
          {
            id: 2,
            title: '👥 Tính năng Đặt nhóm đã sẵn sàng',
            body: 'Giờ đây bạn có thể dễ dàng tạo đơn đặt nước chung cùng hội đồng nghiệp và thanh toán một chạm nhanh chóng qua ZaloPay.',
            time: '2 giờ trước',
            type: 'system',
            unread: true
          },
          {
            id: 3,
            title: '🌟 Tích lũy điểm vàng đổi voucher',
            body: 'Mua sắm và nhận 1 điểm tích lũy trên mỗi 10k chi tiêu thực tế để quy đổi sang nhiều voucher giảm tới 50k cực đã.',
            time: '1 ngày trước',
            type: 'promo',
            unread: false
          },
          {
            id: 4,
            title: '☕ Trải nghiệm Menu 26 món cực phong phú',
            body: 'Serene Brews vừa nâng cấp thực đơn thêm 20 sản phẩm mới gồm các loại Signature Latte, trà thanh mát giải nhiệt và bánh ngọt nướng nóng hổi!',
            time: '3 ngày trước',
            type: 'system',
            unread: false
          }
        ];
      }

      const newNotification = {
        id: Date.now(),
        title: `🛒 Đặt hàng thành công #${orderId}`,
        body: `Đơn hàng của bạn đã được tiếp nhận thành công. Trị giá đơn hàng: ${totalAmount.toLocaleString('vi-VN')}đ. Cảm ơn bạn đã lựa chọn Serene Brews!`,
        time: 'Vừa xong',
        type: 'order',
        unread: true
      };

      currentList.unshift(newNotification);
      localStorage.setItem('serene_notifications_list', JSON.stringify(currentList));
      setHasUnreadNotifications(true);
    }
  };

  useEffect(() => {
    if (!groupRoom) return;

    const fetchGroupRoom = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/group-orders/${groupRoom}`);
        if (response.ok) {
          const data = await response.json();
          setGroupRoomData(data);
         } else if (response.status === 404) {
          showDialog('⚠️ Phòng đặt nước nhóm không tồn tại hoặc đã bị đóng.', () => {
            router.push('/');
          });
        }
      } catch (e) {
        console.error('Error fetching group room:', e);
      }
    };

    fetchGroupRoom();
    const interval = setInterval(fetchGroupRoom, 5000);
    return () => clearInterval(interval);
  }, [groupRoom]);

  const groupItems = groupRoomData?.items || [];
  const groupSubtotal = groupItems.reduce((sum: number, item: any) => sum + item.singlePrice * item.quantity, 0);

  let groupDiscount = 0;
  if (selectedVoucher && groupSubtotal >= selectedVoucher.minSubtotal) {
    if (selectedVoucher.discountType === 'fixed') {
      groupDiscount = selectedVoucher.discountValue;
    } else if (selectedVoucher.discountType === 'percentage') {
      groupDiscount = Math.round((groupSubtotal * selectedVoucher.discountValue) / 100);
    }
  }
  const groupTotal = Math.max(0, groupSubtotal - groupDiscount);

  const displaySubtotal = isGroupActive ? groupSubtotal : subtotal;
  const displayDiscount = isGroupActive ? groupDiscount : discount;
  const displayTotal = isGroupActive ? groupTotal : total;

  useEffect(() => {
    let timer: any;
    if (showQRModal && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [showQRModal, countdown]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const closeQRModal = () => {
    setShowQRModal(false);
  };

  const submitOrder = async () => {
    setIsSubmitting(true);
    try {
      const itemsToPost = isGroupActive
        ? groupItems.map((item: any) => ({
            productId: item.productId,
            name: item.name,
            size: item.size,
            sweetness: item.sweetness,
            ice: item.ice,
            note: item.note,
            quantity: item.quantity,
            singlePrice: item.singlePrice
          }))
        : cart.map(item => ({
            productId: item.product.id,
            name: item.product.name,
            size: item.size,
            sweetness: item.sweetness,
            ice: item.ice,
            note: item.note,
            quantity: item.quantity,
            singlePrice: item.singlePrice
          }));

      const orderPayload = {
        items: itemsToPost,
        subtotal: displaySubtotal,
        discount: displayDiscount,
        total: displayTotal,
        paymentMethod,
        deliveryMethod,
        deliveryAddress: deliveryMethod === 'delivery' ? selectedAddress?.detail : 'Store Pickup'
      };

      // Call Backend API
      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      if (response.ok) {
        const result = await response.json();
        setSuccessOrderData(result.order);
        setOrderStatus('success');
        
        // Add points
        const pointsEarned = Math.floor(displayTotal / 10000);
        addPoints(pointsEarned);

        // Push order notification
        const orderId = result.order?.id || Math.floor(Math.random() * 900000) + 100000;
        pushOrderNotification(orderId, displayTotal);

        if (isGroupActive) {
          await fetch(`http://localhost:5000/api/group-orders/${groupRoom}`, {
            method: 'DELETE'
          });
        }
        clearCart();
      } else {
        // Fallback for demo if backend is offline
        console.warn('Backend offline, processing order locally.');
        const mockOrderId = Math.floor(Math.random() * 900000) + 100000;
        setSuccessOrderData({
          id: mockOrderId,
          total: displayTotal
        });
        setOrderStatus('success');
        
        // Add points
        const pointsEarned = Math.floor(displayTotal / 10000);
        addPoints(pointsEarned);

        // Push order notification
        pushOrderNotification(mockOrderId, displayTotal);

        if (isGroupActive) {
          await fetch(`http://localhost:5000/api/group-orders/${groupRoom}`, {
            method: 'DELETE'
          });
        }
        clearCart();
      }
    } catch (e) {
      console.warn('Network error, processing order locally.', e);
      const mockOrderId = Math.floor(Math.random() * 900000) + 100000;
      setSuccessOrderData({
        id: mockOrderId,
        total: displayTotal
      });
      setOrderStatus('success');
      
      // Add points
      const pointsEarned = Math.floor(displayTotal / 10000);
      addPoints(pointsEarned);

      // Push order notification
      pushOrderNotification(mockOrderId, displayTotal);

      if (isGroupActive) {
        try {
          await fetch(`http://localhost:5000/api/group-orders/${groupRoom}`, {
            method: 'DELETE'
          });
        } catch (err) {}
      }
      clearCart();
    } finally {
      setIsSubmitting(false);
      setShowQRModal(false);
    }
  };

  const handlePayNow = async () => {
    if (isGroupActive) {
      if (groupItems.length === 0) return;
    } else {
      if (cart.length === 0) return;
    }

    if (deliveryMethod === 'delivery' && !selectedAddress) {
      showDialog('⚠️ Vui lòng chọn hoặc thêm địa chỉ nhận hàng trước khi thanh toán.');
      return;
    }
    
    if (paymentMethod === 'ZaloPay') {
      setCountdown(300);
      setShowQRModal(true);
    } else {
      await submitOrder();
    }
  };

  const handleShareBill = () => {
    if (isGroupActive) {
      navigator.clipboard.writeText(`${window.location.origin}/?groupRoom=${groupRoom}`);
      showToast("📋 Đã sao chép link mời đặt nước nhóm!");
    } else {
      showToast("🔗 Đã sao chép link chia hóa đơn!");
    }
  };

  if (orderStatus === 'success' && successOrderData) {
    return (
      <div 
        className="main-content" 
        style={{ 
          backgroundColor: '#FAF9F2', 
          minHeight: '100vh', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          fontFamily: 'var(--font-sans)'
        }}
      >
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>🎉</div>
        <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
          Đặt Hàng Thành Công!
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '24px', lineHeight: 1.5 }}>
          Cảm ơn bạn đã đặt món tại Serene Brews. <br />
          Mã đơn hàng của bạn là <strong>#{successOrderData.id}</strong>.
        </p>
        
        <div 
          style={{ 
            backgroundColor: 'var(--primary-light)', 
            padding: '20px', 
            borderRadius: '20px', 
            width: '100%', 
            marginBottom: '32px' 
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Phương thức:</span>
            <strong>{paymentMethod}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Tổng thanh toán:</span>
            <strong style={{ color: 'var(--primary-color)' }}>
              {successOrderData.total.toLocaleString('vi-VN')}đ
            </strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', borderTop: '1px dashed var(--border-color)', paddingTop: '8px' }}>
            <span>Điểm tích lũy nhận được:</span>
            <strong style={{ color: '#52C41A' }}>
              +{Math.floor(successOrderData.total / 10000)} Điểm
            </strong>
          </div>
        </div>

        <button 
          className="checkout-btn" 
          onClick={() => {
            setOrderStatus('cart');
            router.push('/');
          }}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          Quay lại trang chủ
        </button>
      </div>
    );
  }

  // Group room items by user name
  const groupItemsByUser = groupItems.reduce((acc: any, item: any) => {
    if (!acc[item.userName]) {
      acc[item.userName] = [];
    }
    acc[item.userName].push(item);
    return acc;
  }, {});

  const getProgressData = (pts: number) => {
    if (pts >= 300) {
      return {
        title: 'Hạng Vàng (Gold)',
        sub: 'Bạn đã đạt cấp độ thành viên cao nhất! 🏆',
        percent: 100
      };
    }
    if (pts >= 100) {
      const needed = 300 - pts;
      const pct = Math.min(100, Math.floor(((pts - 100) / 200) * 100));
      return {
        title: 'Hạng Bạc (Silver)',
        sub: `Tích lũy thêm ${needed} điểm để lên Hạng Vàng`,
        percent: pct
      };
    }
    const needed = 100 - pts;
    const pct = Math.min(100, Math.floor((pts / 100) * 100));
    return {
      title: 'Hạng Đồng (Bronze)',
      sub: `Tích lũy thêm ${needed} điểm để lên Hạng Bạc`,
      percent: pct
    };
  };

  const progressData = getProgressData(loyaltyPoints);

  const rewardsList = [
    { code: 'SERENE15', cost: 0, desc: 'Giảm 15k cho đơn từ 100k' },
    { code: 'FREESHIP', cost: 80, desc: 'Freeship giảm 20k đơn từ 50k' },
    { code: 'COFFEEGO', cost: 100, desc: 'Giảm 10% tổng đơn hàng' },
    { code: 'SERENE50', cost: 200, desc: 'Giảm 50k đơn từ 200k' }
  ];

  const isEmpty = isGroupActive ? groupItems.length === 0 : cart.length === 0;

  return (
    <div className="main-content" style={{ backgroundColor: '#FAF9F2', minHeight: '100vh', paddingBottom: '110px' }}>
      {/* Header */}
      <div className="cart-header" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <button className="back-arrow" onClick={() => {
          if (isGroupActive) {
            router.push(`/?groupRoom=${groupRoom}`);
          } else {
            router.push('/');
          }
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <h1 className="cart-title">{isGroupActive ? 'Đơn Nhóm' : 'Giỏ Hàng'}</h1>
      </div>

      {isEmpty ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', fontFamily: 'var(--font-sans)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>☕</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '24px' }}>
            {isGroupActive ? 'Chưa có thành viên nào thêm món vào đơn nhóm' : 'Giỏ hàng của bạn đang trống'}
          </p>
          <button 
            className="checkout-btn" 
            onClick={() => {
              if (isGroupActive) {
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
        <>
          {/* Delivery Method Selection */}
          <div className="section-title">Phương thức nhận hàng</div>
          <div style={{ padding: '0 24px', marginBottom: '16px', display: 'flex', gap: '12px', fontFamily: 'var(--font-sans)' }}>
            <button
              onClick={() => setDeliveryMethod('pickup')}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '16px',
                border: '1.5px solid ' + (deliveryMethod === 'pickup' ? 'var(--primary-color)' : 'var(--border-color)'),
                backgroundColor: deliveryMethod === 'pickup' ? 'var(--primary-light)' : 'var(--white)',
                color: 'var(--text-primary)',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
            >
              <span style={{ fontSize: '16px' }}>🏪 Tự đến lấy</span>
              <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-secondary)' }}>Tại cửa hàng Quận 1</span>
            </button>
            <button
              onClick={() => setDeliveryMethod('delivery')}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '16px',
                border: '1.5px solid ' + (deliveryMethod === 'delivery' ? 'var(--primary-color)' : 'var(--border-color)'),
                backgroundColor: deliveryMethod === 'delivery' ? 'var(--primary-light)' : 'var(--white)',
                color: 'var(--text-primary)',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
            >
              <span style={{ fontSize: '16px' }}>🛵 Giao tận nơi</span>
              <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-secondary)' }}>Ship nhanh 15-30 phút</span>
            </button>
          </div>

          {/* Delivery Address Details */}
          {deliveryMethod === 'delivery' && (
            <div style={{ padding: '0 24px', marginBottom: '16px', fontFamily: 'var(--font-sans)' }}>
              <div 
                onClick={() => setIsAddressDrawerOpen(true)}
                style={{
                  backgroundColor: 'var(--white)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
                }}
              >
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{
                    backgroundColor: 'var(--primary-light)',
                    width: '38px',
                    height: '38px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px'
                  }}>
                    📍
                  </div>
                  <div style={{ textAlign: 'left', flex: 1, maxWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {selectedAddress ? selectedAddress.tag : 'Chưa có địa chỉ'}
                      </span>
                      {selectedAddress && (
                        <span style={{
                          backgroundColor: 'var(--primary-light)',
                          color: 'var(--primary-color)',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px'
                        }}>Đang chọn</span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedAddress ? selectedAddress.detail : 'Vui lòng chọn hoặc thêm địa chỉ nhận hàng'}
                    </div>
                  </div>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </div>
            </div>
          )}

          {/* Selected Items List */}
          <div className="section-title">
            {isGroupActive ? `Đơn hàng nhóm (${groupRoom})` : 'Selected Items'}
          </div>

          {isGroupActive ? (
            <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {Object.keys(groupItemsByUser).map((user) => (
                <div key={user} style={{
                  backgroundColor: 'var(--white)',
                  borderRadius: '20px',
                  padding: '16px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
                  border: '1px solid var(--border-color)',
                  fontFamily: 'var(--font-sans)'
                }}>
                  <div style={{ 
                    fontSize: '13px', 
                    fontWeight: 700, 
                    color: 'var(--primary-color)',
                    borderBottom: '1px solid var(--border-color)',
                    paddingBottom: '8px',
                    marginBottom: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>👤 {user} {user === zaloUser.name ? '(Bạn)' : ''}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      {groupItemsByUser[user].reduce((s: number, i: any) => s + i.quantity, 0)} món
                    </span>
                  </div>
                  
                  {groupItemsByUser[user].map((item: any) => {
                    const isFood = products.find(p => p.id === item.productId)?.category === 'Ngọt ngào';
                    const optionsMeta = isFood
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
                      <div key={item.id} style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'center' }}>
                        <img 
                          src={products.find(p => p.id === item.productId)?.image || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=400'} 
                          alt={item.name} 
                          style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover' }} 
                        />
                        <div style={{ flex: 1, textAlign: 'left' }}>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{optionsMeta || 'Mặc định'}</div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                            {(item.singlePrice * item.quantity).toLocaleString('vi-VN')}đ x {item.quantity}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            <div className="cart-items">
              {cart.map((item) => {
                const isFood = item.product.category === 'Ngọt ngào';
                const optionsMeta = isFood
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
                  <div key={item.cartId} className="cart-item">
                    <img src={item.product.image} alt={item.product.name} className="cart-item-image" />
                    <div className="cart-item-details">
                      <div className="cart-item-name">{item.product.name}</div>
                      <div className="cart-item-meta">{optionsMeta || 'Default options'}</div>
                      <div className="cart-item-price">{(item.singlePrice * item.quantity).toLocaleString('vi-VN')}đ</div>
                    </div>
                    {/* Quantity controls */}
                    <div className="quantity-control">
                      <button 
                        className="quantity-btn"
                        onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                      >
                        −
                      </button>
                      <span className="quantity-val">{item.quantity}</span>
                      <button 
                        className="quantity-btn"
                        onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add more items */}
          <div className="add-more-container">
            <button className="add-more-btn" onClick={() => {
              if (isGroupActive) {
                router.push(`/?groupRoom=${groupRoom}`);
              } else {
                router.push('/');
              }
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Thêm món khác
            </button>
          </div>

          {/* Loyalty Section */}
          <div className="loyalty-container">
            <div className="loyalty-card">
              <div className="loyalty-icon-circle">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1 9.8a7 7 0 0 1-9 8.2Z"/>
                  <path d="M9 22v-4"/>
                  <path d="M19 2c-3 3-6.5 4.5-10 4.5"/>
                </svg>
              </div>
              <div className="loyalty-info">
                <div className="loyalty-title">Thành viên: {progressData.title}</div>
                <div className="loyalty-sub">{progressData.sub}</div>
                <div className="loyalty-progress-bg">
                  <div className="loyalty-progress-fill" style={{ width: `${progressData.percent}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Rewards/Loyalty Points Exchange Panel */}
          <div className="section-title">🎁 Đổi quà thành viên</div>
          <div style={{ padding: '0 24px', marginBottom: '16px' }}>
            <div style={{
              backgroundColor: 'var(--white)',
              borderRadius: '20px',
              padding: '16px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 4px 15px rgba(94, 88, 66, 0.03)',
              fontFamily: 'var(--font-sans)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Điểm tích lũy hiện tại
                </span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary-color)' }}>
                  ★ {loyaltyPoints} Điểm
                </span>
              </div>

              {/* Horizontal Scrollable Voucher Items */}
              <div style={{
                display: 'flex',
                gap: '12px',
                overflowX: 'auto',
                paddingBottom: '8px',
              }}>
                {rewardsList.map((reward) => {
                  const isUnlocked = unlockedVouchers.includes(reward.code);
                  const canAfford = loyaltyPoints >= reward.cost;

                  return (
                    <div 
                      key={reward.code}
                      style={{
                        minWidth: '160px',
                        backgroundColor: 'var(--bg-color)',
                        borderRadius: '16px',
                        padding: '12px',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        textAlign: 'left'
                      }}
                    >
                      <div>
                        <div style={{ 
                          fontSize: '11px', 
                          fontWeight: 700, 
                          color: 'var(--primary-color)',
                          backgroundColor: 'var(--primary-light)',
                          display: 'inline-block',
                          padding: '2px 6px',
                          borderRadius: '6px',
                          marginBottom: '6px'
                        }}>
                          {reward.code}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-primary)', fontWeight: 500, lineHeight: '1.3', height: '32px', overflow: 'hidden' }}>
                          {reward.desc}
                        </div>
                      </div>

                      <div style={{ marginTop: '10px' }}>
                        {isUnlocked ? (
                          <button
                            onClick={() => {
                              applyVoucher(reward.code);
                              alert(`🎫 Đã áp dụng mã ${reward.code}!`);
                            }}
                            style={{
                              width: '100%',
                              backgroundColor: 'transparent',
                              color: 'var(--primary-color)',
                              border: '1px solid var(--primary-color)',
                              borderRadius: '10px',
                              padding: '6px 0',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Dùng ngay
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (canAfford) {
                                const success = spendPoints(reward.cost, reward.code);
                                if (success) {
                                  alert(`🎉 Chúc mừng bạn đã đổi thành công mã ${reward.code}!`);
                                }
                              } else {
                                alert(`⚠️ Bạn cần thêm ${reward.cost - loyaltyPoints} điểm để đổi mã này.`);
                              }
                            }}
                            style={{
                              width: '100%',
                              backgroundColor: canAfford ? 'var(--primary-color)' : '#E6E4DD',
                              color: canAfford ? 'white' : 'var(--text-secondary)',
                              border: 'none',
                              borderRadius: '10px',
                              padding: '6px 0',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Đổi ({reward.cost} ★)
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Share Bill */}
          <div className="share-bill-container">
            <div className="share-bill-card" onClick={handleShareBill}>
              <div className="share-bill-left">
                <div className="share-bill-icon-circle">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue-text)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <div>
                  <div className="share-bill-title">{isGroupActive ? 'Mời thêm bạn' : 'Share bill'}</div>
                  <div className="share-bill-sub">{isGroupActive ? 'Sao chép link mời bạn chung phòng' : 'Chia tiền cùng hội bạn'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </div>
            </div>
          </div>

          {/* Voucher Section */}
          <div className="section-title">Khuyến mãi / Voucher</div>
          <div style={{ padding: '0 24px', marginBottom: '16px' }}>
            <div 
              onClick={() => setIsVoucherModalOpen(true)}
              style={{
                backgroundColor: 'var(--white)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  backgroundColor: 'var(--primary-light)',
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
                    <path d="M13 5v14"/>
                  </svg>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {selectedVoucher ? selectedVoucher.code : 'Chọn hoặc nhập mã ưu đãi'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {selectedVoucher ? selectedVoucher.description : 'Tiết kiệm thêm chi phí đơn hàng'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {selectedVoucher ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeVoucher();
                    }}
                    style={{
                      border: 'none',
                      background: '#FFEBEB',
                      color: '#FF4D4F',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Hủy áp dụng
                  </button>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                )}
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="section-title">Payment Method</div>
          <div className="payment-container">
            <div className="payment-card">
              <div className="payment-left">
                <div className="payment-icon-zalo" style={{ backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="24" height="24" rx="6" fill="#0068ff"/>
                    <circle cx="12" cy="12" r="5" fill="none" stroke="white" strokeWidth="2.5"/>
                    <line x1="9.5" y1="12" x2="14.5" y2="12" stroke="white" strokeWidth="2.5"/>
                  </svg>
                </div>
                <div>
                  <div className="payment-title">ZaloPay</div>
                  <div className="payment-desc">Thanh toán 1 chạm</div>
                </div>
              </div>
              <div className="payment-radio" onClick={() => setPaymentMethod('ZaloPay')}>
                {paymentMethod === 'ZaloPay' && <div className="payment-radio-inner"></div>}
              </div>
            </div>
          </div>
          <div className="change-method-container">
            <button 
              className="change-method-link"
              onClick={() => setPaymentMethod(paymentMethod === 'ZaloPay' ? 'Cash' : 'ZaloPay')}
            >
              Thay đổi phương thức ({paymentMethod === 'ZaloPay' ? 'Tiền mặt' : 'ZaloPay'})
            </button>
          </div>

          {/* Calculations Summary */}
          <div className="bill-summary-container">
            <div className="bill-summary-card">
              <div className="bill-row">
                <span>Subtotal</span>
                <span>{displaySubtotal.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="bill-row discount">
                <span>Discount</span>
                <span>-{displayDiscount.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="bill-row total">
                <span className="bill-total-label">Total</span>
                <span className="bill-total-value">{displayTotal.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
          </div>

          {/* Sticky Checkout Bar */}
          <div className="checkout-footer" style={{ bottom: '75px', padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="checkout-total-label">Total</div>
              <div className="checkout-total-price" style={{ fontSize: '20px' }}>
                {displayTotal.toLocaleString('vi-VN')}đ
              </div>
            </div>
            <button 
              className="checkout-btn" 
              onClick={handlePayNow}
              disabled={isSubmitting || (isGroupActive && groupItems.length === 0)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 28px', borderRadius: '30px' }}
            >
              {isSubmitting ? 'Đang xử lý...' : (
                <>
                  Pay Now
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </>
              )}
            </button>
          </div>
        </>
      )}

      {/* Navigation */}
      <BottomNav activeTab="orders" />

      {/* Address Selection Drawer */}
      {isAddressDrawerOpen && (
        <>
          <div className="drawer-backdrop" onClick={() => setIsAddressDrawerOpen(false)} />
          <div className="drawer-container">
            <div className="drawer-handle-bar" onClick={() => setIsAddressDrawerOpen(false)}>
              <div className="drawer-handle" />
            </div>
            <div className="drawer-header">
              <h3 className="drawer-title">Chọn địa chỉ nhận hàng</h3>
              <button className="drawer-close-btn" onClick={() => setIsAddressDrawerOpen(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="drawer-content">
              {/* Saved Address list */}
              <div className="address-list">
                {savedAddresses.map((addr) => (
                  <div 
                    key={addr.id} 
                    className="address-item-premium"
                    style={{ 
                      cursor: 'pointer',
                      borderColor: selectedAddress?.id === addr.id ? 'var(--primary-color)' : 'var(--border-color)',
                      backgroundColor: selectedAddress?.id === addr.id ? 'var(--primary-light)' : 'var(--white)',
                      marginBottom: '10px'
                    }}
                    onClick={() => {
                      setSelectedAddress(addr);
                      setIsAddressDrawerOpen(false);
                    }}
                  >
                    <div className="address-item-details" style={{ textAlign: 'left' }}>
                      <span className="address-item-tag">{addr.tag}</span>
                      <span className="address-item-text">{addr.detail}</span>
                    </div>
                    {selectedAddress?.id === addr.id && (
                      <span style={{ fontSize: '18px', color: 'var(--primary-color)', fontWeight: 'bold' }}>✓</span>
                    )}
                  </div>
                ))}
                {savedAddresses.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '16px 0', fontSize: '14px' }}>
                    Chưa có địa chỉ nào được lưu.
                  </div>
                )}
              </div>

              {/* Add Address inline form inside checkout page */}
              <form onSubmit={handleAddAddressCheckout} className="address-form">
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px', textAlign: 'left' }}>Thêm địa chỉ mới</div>
                
                <div className="address-input-group" style={{ textAlign: 'left' }}>
                  <label>Tên gợi nhớ (Nhà riêng, Văn phòng...)</label>
                  <input 
                    type="text" 
                    className="address-input" 
                    placeholder="Nhập tên nhãn địa chỉ" 
                    value={tempAddressTag} 
                    onChange={e => setTempAddressTag(e.target.value)}
                    required
                  />
                </div>

                <div className="address-input-group" style={{ textAlign: 'left' }}>
                  <label>Địa chỉ chi tiết</label>
                  <input 
                    type="text" 
                    className="address-input" 
                    placeholder="Số nhà, tên đường, phường/xã..." 
                    value={tempAddressDetail} 
                    onChange={e => setTempAddressDetail(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="address-submit-btn">
                  Thêm và chọn địa chỉ này
                </button>
              </form>
            </div>
          </div>
        </>
      )}

      {/* ZaloPay QR Modal Overlay */}
      {showQRModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '480px',
          height: '100%',
          backgroundColor: 'rgba(46, 45, 41, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            padding: '28px 24px',
            width: '100%',
            maxWidth: '380px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
          }}>
            {/* Close button */}
            <button 
              onClick={closeQRModal}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                padding: '4px',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            {/* Brand Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                <rect width="24" height="24" rx="6" fill="#0068ff"/>
                <circle cx="12" cy="12" r="5" fill="none" stroke="white" strokeWidth="2.5"/>
                <line x1="9.5" y1="12" x2="14.5" y2="12" stroke="white" strokeWidth="2.5"/>
              </svg>
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#0068ff' }}>ZaloPay QR Checkout</span>
            </div>

            {/* Amount info */}
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Số tiền thanh toán
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {total.toLocaleString('vi-VN')}đ
              </div>
            </div>

            {/* Timer Countdown */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: countdown > 60 ? 'var(--primary-light)' : '#FFEBEB',
              padding: '8px 16px',
              borderRadius: '20px',
              marginBottom: '20px',
              transition: 'all 0.3s ease',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={countdown > 60 ? 'var(--primary-color)' : '#FF4D4F'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span style={{
                fontSize: '14px',
                fontWeight: 600,
                color: countdown > 60 ? 'var(--primary-color)' : '#FF4D4F',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {countdown > 0 ? `Mã QR hết hạn trong: ${formatCountdown(countdown)}` : 'Mã QR đã hết hạn'}
              </span>
            </div>

            {/* QR Code Graphic */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1.5px solid var(--border-color)',
              padding: '16px',
              borderRadius: '20px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              marginBottom: '20px',
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '190px',
              height: '190px',
            }}>
              {countdown > 0 ? (
                <svg width="160" height="160" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Background */}
                  <rect width="100" height="100" fill="white" />
                  
                  {/* Finder pattern Top-Left */}
                  <rect x="5" y="5" width="25" height="25" fill="#2E2D29" rx="3" />
                  <rect x="10" y="10" width="15" height="15" fill="white" rx="1" />
                  <rect x="13" y="13" width="9" height="9" fill="#2E2D29" rx="1" />
                  
                  {/* Finder pattern Top-Right */}
                  <rect x="70" y="5" width="25" height="25" fill="#2E2D29" rx="3" />
                  <rect x="75" y="10" width="15" height="15" fill="white" rx="1" />
                  <rect x="78" y="13" width="9" height="9" fill="#2E2D29" rx="1" />
                  
                  {/* Finder pattern Bottom-Left */}
                  <rect x="5" y="70" width="25" height="25" fill="#2E2D29" rx="3" />
                  <rect x="10" y="75" width="15" height="15" fill="white" rx="1" />
                  <rect x="13" y="78" width="9" height="9" fill="#2E2D29" rx="1" />
                  
                  {/* Alignment pattern bottom-right area */}
                  <rect x="72" y="72" width="11" height="11" fill="#2E2D29" rx="1.5" />
                  <rect x="75" y="75" width="5" height="5" fill="white" rx="0.5" />
                  <rect x="77" y="77" width="1" height="1" fill="#2E2D29" />

                  {/* Some random data blocks/dots */}
                  <rect x="35" y="8" width="4" height="4" fill="#2E2D29" rx="1" />
                  <rect x="43" y="6" width="6" height="4" fill="#2E2D29" rx="1" />
                  <rect x="54" y="9" width="4" height="6" fill="#2E2D29" rx="1" />
                  <rect x="62" y="5" width="5" height="4" fill="#2E2D29" rx="1" />
                  <rect x="38" y="18" width="8" height="4" fill="#2E2D29" rx="1" />
                  <rect x="50" y="16" width="4" height="8" fill="#2E2D29" rx="1" />
                  <rect x="60" y="20" width="6" height="4" fill="#2E2D29" rx="1" />

                  <rect x="8" y="36" width="6" height="4" fill="#2E2D29" rx="1" />
                  <rect x="18" y="42" width="4" height="8" fill="#2E2D29" rx="1" />
                  <rect x="6" y="52" width="8" height="4" fill="#2E2D29" rx="1" />
                  <rect x="22" y="58" width="4" height="6" fill="#2E2D29" rx="1" />

                  <rect x="74" y="38" width="8" height="4" fill="#2E2D29" rx="1" />
                  <rect x="86" y="44" width="4" height="8" fill="#2E2D29" rx="1" />
                  <rect x="78" y="54" width="6" height="4" fill="#2E2D29" rx="1" />
                  <rect x="84" y="60" width="4" height="6" fill="#2E2D29" rx="1" />

                  <rect x="36" y="74" width="6" height="4" fill="#2E2D29" rx="1" />
                  <rect x="46" y="82" width="8" height="4" fill="#2E2D29" rx="1" />
                  <rect x="38" y="88" width="4" height="6" fill="#2E2D29" rx="1" />
                  <rect x="56" y="76" width="4" height="8" fill="#2E2D29" rx="1" />
                  <rect x="62" y="86" width="6" height="4" fill="#2E2D29" rx="1" />

                  <rect x="34" y="34" width="32" height="32" fill="white" />
                  <rect x="38" y="38" width="24" height="24" rx="6" fill="#0068ff" />
                  <circle cx="50" cy="50" r="5" fill="none" stroke="white" strokeWidth="2" />
                  <line x1="47.5" y1="50" x2="52.5" y2="50" stroke="white" strokeWidth="2" />
                </svg>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FF4D4F',
                  textAlign: 'center',
                  padding: '12px'
                }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: '8px' }}>
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                  </svg>
                  <span style={{ fontSize: '13px', fontWeight: 500 }}>QR đã hết hạn</span>
                </div>
              )}
            </div>

            {/* Instructions */}
            <p style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              textAlign: 'center',
              lineHeight: 1.5,
              marginBottom: '24px',
              padding: '0 8px',
            }}>
              {countdown > 0 
                ? "Chụp màn hình và quét mã QR này trong ứng dụng ZaloPay hoặc ứng dụng ngân hàng để hoàn tất." 
                : "Vui lòng bấm nút bên dưới để tạo lại mã thanh toán mới."}
            </p>

            {/* Footer Actions */}
            {countdown > 0 ? (
              <button
                onClick={submitOrder}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--primary-color)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '30px',
                  padding: '14px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(94, 88, 66, 0.2)',
                }}
              >
                {isSubmitting ? 'Đang xử lý...' : 'Xác nhận đã thanh toán'}
              </button>
            ) : (
              <button
                onClick={() => {
                  setCountdown(300);
                }}
                style={{
                  width: '100%',
                  backgroundColor: '#0068ff',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '30px',
                  padding: '14px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(0, 104, 255, 0.2)',
                }}
              >
                Tạo mã QR mới
              </button>
            )}

            <button
              onClick={closeQRModal}
              disabled={isSubmitting}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '14px',
                fontWeight: 500,
                marginTop: '16px',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Hủy thanh toán
            </button>
          </div>
        </div>
      )}
      {/* Voucher Selector Modal */}
      {isVoucherModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '480px',
          height: '100%',
          backgroundColor: 'rgba(46, 45, 41, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'flex-end',
          zIndex: 99999,
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            padding: '24px',
            width: '100%',
            maxHeight: '80%',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.1)',
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Chọn mã ưu đãi</h3>
              <button 
                onClick={() => {
                  setIsVoucherModalOpen(false);
                  setVoucherInputError('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '28px',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0,
                }}
              >
                ×
              </button>
            </div>

            {/* Custom Code Input */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input 
                type="text"
                placeholder="Nhập mã voucher (e.g. SERENE50)..."
                value={voucherInput}
                onChange={(e) => setVoucherInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1.5px solid var(--border-color)',
                  outline: 'none',
                  fontSize: '14px',
                  textTransform: 'uppercase',
                }}
              />
              <button
                onClick={() => {
                  if (!voucherInput.trim()) return;
                  const codeUpper = voucherInput.trim().toUpperCase();
                  if (!unlockedVouchers.includes(codeUpper)) {
                    setVoucherInputError('Mã này chưa được mở khóa bằng điểm tích lũy!');
                    return;
                  }
                  const success = applyVoucher(voucherInput.trim());
                  if (success) {
                    setIsVoucherModalOpen(false);
                    setVoucherInput('');
                    setVoucherInputError('');
                  } else {
                    setVoucherInputError('Mã không hợp lệ hoặc chưa đạt đơn hàng tối thiểu.');
                  }
                }}
                style={{
                  backgroundColor: 'var(--primary-color)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0 20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Áp dụng
              </button>
            </div>
 
            {voucherInputError && (
              <div style={{ color: '#FF4D4F', fontSize: '12px', marginBottom: '16px', fontWeight: 500 }}>
                ⚠️ {voucherInputError}
              </div>
            )}
 
            {/* Vouchers List */}
            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '20px' }}>
              {availableVouchers.filter(v => unlockedVouchers.includes(v.code)).map((voucher) => {
                const isEligible = displaySubtotal >= voucher.minSubtotal;
                const isCurrentlySelected = selectedVoucher?.code === voucher.code;
 
                return (
                  <div 
                    key={voucher.code}
                    onClick={() => {
                      if (!isEligible) return;
                      applyVoucher(voucher.code);
                      setIsVoucherModalOpen(false);
                      setVoucherInputError('');
                    }}
                    style={{
                      border: isCurrentlySelected ? '1.5px solid var(--primary-color)' : '1px solid var(--border-color)',
                      borderRadius: '16px',
                      padding: '16px',
                      backgroundColor: isEligible ? '#FFFFFF' : '#FAF9F6',
                      opacity: isEligible ? 1 : 0.6,
                      cursor: isEligible ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      position: 'relative',
                    }}
                  >
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ 
                          fontSize: '14px', 
                          fontWeight: 700, 
                          color: isEligible ? 'var(--primary-color)' : 'var(--text-secondary)',
                          backgroundColor: 'var(--primary-light)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          textTransform: 'uppercase',
                        }}>
                          {voucher.code}
                        </span>
                        {isCurrentlySelected && (
                          <span style={{ fontSize: '12px', color: '#52C41A', fontWeight: 600 }}>
                            ✓ Đang chọn
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '2px' }}>
                        {voucher.description}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Đơn tối thiểu: {voucher.minSubtotal.toLocaleString('vi-VN')}đ
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
