import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { BottomNav } from '@/components/BottomNav';
import { useCart } from '@/components/CartContext';

export default function ProfilePage() {
  const router = useRouter();
  const { zaloUser, loyaltyPoints, unlockedVouchers, availableVouchers, spendPoints, addPoints, showToast, showDialog } = useCart();

  const [activeModal, setActiveModal] = useState<'vouchers' | 'addresses' | 'support' | 'terms' | 'lucky-wheel' | null>(null);

  // Address State & Storage
  interface Address {
    id: string;
    tag: string;
    detail: string;
  }
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [newTag, setNewTag] = useState('');
  const [newDetail, setNewDetail] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('serene_saved_addresses');
      if (saved) {
        setAddresses(JSON.parse(saved));
      } else {
        // Seed default addresses
        const defaults = [
          { id: '1', tag: 'Nhà riêng', detail: 'Toà S2.02 Vinhomes Grand Park, Quận 9, TP. HCM' },
          { id: '2', tag: 'Văn phòng', detail: 'Zalo tòa nhà VNG Campus, Quận 7, TP. HCM' }
        ];
        setAddresses(defaults);
        localStorage.setItem('serene_saved_addresses', JSON.stringify(defaults));
      }
    }
  }, []);

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim() || !newDetail.trim()) return;
    const newAddress: Address = {
      id: Date.now().toString(),
      tag: newTag.trim(),
      detail: newDetail.trim()
    };
    const updated = [...addresses, newAddress];
    setAddresses(updated);
    localStorage.setItem('serene_saved_addresses', JSON.stringify(updated));
    setNewTag('');
    setNewDetail('');
  };

  const handleDeleteAddress = (id: string) => {
    const updated = addresses.filter(item => item.id !== id);
    setAddresses(updated);
    localStorage.setItem('serene_saved_addresses', JSON.stringify(updated));
  };

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const handleCopyCode = (code: string) => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  const myVouchers = availableVouchers.filter(v => unlockedVouchers.includes(v.code));

  // Lucky Spin Wheel Minigame setup
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<string | null>(null);

  const sectors = [
    { label: 'SERENE15', color: '#5E5842', type: 'voucher', value: 'SERENE15' },
    { label: '+5★ Điểm', color: '#F4F3E6', type: 'points', value: 5 },
    { label: 'FREESHIP', color: '#5E5842', type: 'voucher', value: 'FREESHIP' },
    { label: 'May mắn nhé', color: '#F4F3E6', type: 'loss', value: 0 },
    { label: 'COFFEEGO', color: '#5E5842', type: 'voucher', value: 'COFFEEGO' },
    { label: '+10★ Điểm', color: '#F4F3E6', type: 'points', value: 10 },
    { label: 'SERENE50', color: '#5E5842', type: 'voucher', value: 'SERENE50' },
    { label: '+20★ Điểm', color: '#F4F3E6', type: 'points', value: 20 },
  ];

  const drawWheel = (ctx: CanvasRenderingContext2D, currentAngle: number) => {
    const numSectors = sectors.length;
    const arc = Math.PI * 2 / numSectors;
    const radius = 120;
    const centerX = 150;
    const centerY = 150;

    ctx.clearRect(0, 0, 300, 300);

    // Draw sectors
    sectors.forEach((sector, idx) => {
      const angle = currentAngle + idx * arc;
      ctx.beginPath();
      ctx.fillStyle = sector.color;
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, angle, angle + arc);
      ctx.lineTo(centerX, centerY);
      ctx.fill();
      ctx.strokeStyle = '#FAF9F2';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle + arc / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = sector.color === '#5E5842' ? '#FAF9F2' : '#2E2D29';
      ctx.font = 'bold 11px var(--font-sans)';
      ctx.fillText(sector.label, radius - 15, 4);
      ctx.restore();
    });

    // Draw center pin
    ctx.beginPath();
    ctx.fillStyle = '#FAF9F2';
    ctx.arc(centerX, centerY, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#5E5842';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.fillStyle = '#5E5842';
    ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
    ctx.fill();

    // Draw pointer at the top
    ctx.beginPath();
    ctx.fillStyle = '#C25C5C';
    ctx.moveTo(centerX - 10, centerY - radius - 12);
    ctx.lineTo(centerX + 10, centerY - radius - 12);
    ctx.lineTo(centerX, centerY - radius + 8);
    ctx.closePath();
    ctx.fill();
  };

  // Draw the initial wheel when the modal is opened
  useEffect(() => {
    if (activeModal === 'lucky-wheel' && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        drawWheel(ctx, -Math.PI / 2);
      }
    }
  }, [activeModal]);

  const startSpin = () => {
    if (isSpinning) return;
    if (loyaltyPoints < 20) {
      showDialog('⚠️ Bạn cần ít nhất 20★ điểm để tham gia quay thưởng.');
      return;
    }

    // Deduct 20 points
    const success = spendPoints(20, '');
    if (!success) return;

    setIsSpinning(true);
    setSpinResult(null);

    // Pick a random sector to land on
    const targetIdx = Math.floor(Math.random() * sectors.length);
    const numSectors = sectors.length;
    const arc = Math.PI * 2 / numSectors;

    // Target stopping angle placing target index at 12 o'clock pointer
    const baseAngle = -Math.PI / 2;
    const targetSectorCenter = targetIdx * arc + arc / 2;
    const finalAngle = baseAngle - targetSectorCenter;

    // Add 4-6 full spins
    const totalRotation = finalAngle + Math.PI * 2 * (4 + Math.floor(Math.random() * 3));

    let startTimestamp: number | null = null;
    const duration = 3500; // 3.5 seconds

    const animate = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentAngle = baseAngle + (totalRotation - baseAngle) * easeProgress;

      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          drawWheel(ctx, currentAngle);
        }
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Spin finished
        setIsSpinning(false);
        const prize = sectors[targetIdx];
        
        if (prize.type === 'voucher') {
          // Unlock voucher code (requires 0 points)
          spendPoints(0, prize.value as string);
          setSpinResult(`🎟️ Chúc mừng! Bạn trúng voucher ${prize.value}.`);
        } else if (prize.type === 'points') {
          // Add points
          addPoints(prize.value as number);
          setSpinResult(`★ Chúc mừng! Bạn nhận thêm ${prize.value} điểm thưởng.`);
        } else {
          setSpinResult('🍀 Chúc bạn may mắn lần sau!');
        }
      }
    };

    requestAnimationFrame(animate);
  };

  const renderLuckyWheel = () => (
    <div style={{ textAlign: 'center', fontFamily: 'var(--font-sans)' }}>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
        Dùng 20★ điểm tích lũy để quay thưởng 100% trúng quà Voucher & Điểm thưởng!
      </p>

      <div style={{ position: 'relative', width: '300px', height: '300px', margin: '0 auto' }}>
        <canvas 
          ref={canvasRef} 
          width="300" 
          height="300" 
          style={{ display: 'block', maxWidth: '100%' }} 
        />
      </div>

      <div style={{ margin: '20px 0' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Điểm của bạn</div>
        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary-color)', marginTop: '4px' }}>
          ★ {loyaltyPoints} Điểm
        </div>
      </div>

      {spinResult && (
        <div style={{ 
          backgroundColor: 'var(--primary-light)', 
          padding: '12px 16px', 
          borderRadius: '12px', 
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--primary-color)',
          marginBottom: '16px',
          border: '1px dashed var(--primary-color)'
        }}>
          {spinResult}
        </div>
      )}

      <button 
        className="address-submit-btn" 
        onClick={startSpin} 
        disabled={isSpinning}
        style={{ width: '100%', marginTop: '8px' }}
      >
        {isSpinning ? 'Đang quay...' : 'Quay ngay (20★)'}
      </button>
    </div>
  );

  const getTierInfo = (pts: number) => {
    if (pts >= 300) {
      return {
        name: 'HẠNG VÀNG (GOLD)',
        gradient: 'linear-gradient(135deg, #BF953F 0%, #FCF6BA 25%, #B38728 50%, #FBF5B7 75%, #AA771C 100%)',
        color: '#523A03',
        sub: 'Bạn đã đạt hạng thẻ cao nhất 🏆'
      };
    }
    if (pts >= 100) {
      return {
        name: 'HẠNG BẠC (SILVER)',
        gradient: 'linear-gradient(135deg, #7E8B9B 0%, #D1D7E0 50%, #7E8B9B 100%)',
        color: '#2A313C',
        sub: `Tích lũy thêm ${300 - pts} điểm để lên hạng VÀNG`
      };
    }
    return {
      name: 'HẠNG ĐỒNG (BRONZE)',
      gradient: 'linear-gradient(135deg, #A05C33 0%, #ECC5A8 50%, #A05C33 100%)',
      color: '#FFFFFF',
      sub: `Tích lũy thêm ${100 - pts} điểm để lên hạng BẠC`
    };
  };

  const tier = getTierInfo(loyaltyPoints);

  const menuItems = [
    { 
      label: 'Lịch sử đơn hàng', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
      ), 
      action: () => {
        const groupRoom = router.query.groupRoom;
        if (groupRoom) {
          router.push(`/history?groupRoom=${groupRoom}`);
        } else {
          router.push('/history');
        }
      } 
    },
    { 
      label: 'Ưu đãi của tôi', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="8" width="18" height="12" rx="2"/>
          <path d="M12 8V4H8a2 2 0 0 1 0-4h8a2 2 0 0 1 0 4h-4"/>
          <path d="M12 21V8"/>
          <path d="M7.5 8a2.5 2.5 0 0 1 0-5H12"/>
          <path d="M16.5 8a2.5 2.5 0 0 0 0-5H12"/>
        </svg>
      ), 
      action: () => setActiveModal('vouchers') 
    },
    { 
      label: 'Vòng quay may mắn', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 2v20M2 12h20M12 12l5-5M12 12l-5 5M12 12l5 5M12 12l-5-5"/>
        </svg>
      ), 
      action: () => setActiveModal('lucky-wheel') 
    },
    { 
      label: 'Địa chỉ đã lưu', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      ), 
      action: () => setActiveModal('addresses') 
    },
    { 
      label: 'Liên hệ hỗ trợ', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
        </svg>
      ), 
      action: () => setActiveModal('support') 
    },
    { 
      label: 'Điều khoản dịch vụ', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <path d="M9 12h6M9 16h6M9 8h6"/>
        </svg>
      ), 
      action: () => setActiveModal('terms') 
    }
  ];

  const renderVouchers = () => (
    <div className="voucher-list">
      {myVouchers.length > 0 ? (
        myVouchers.map((v) => (
          <div key={v.code} className="voucher-card-premium">
            <div className="voucher-card-left">
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>🎟️</div>
              <div>{v.code}</div>
            </div>
            <div className="voucher-card-right">
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                  {v.description}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Áp dụng cho đơn từ {v.minSubtotal.toLocaleString('vi-VN')}đ
                </div>
              </div>
              <button 
                className="voucher-copy-btn"
                onClick={() => handleCopyCode(v.code)}
              >
                {copiedCode === v.code ? 'Đã sao chép! ✓' : 'Sao chép mã'}
              </button>
            </div>
          </div>
        ))
      ) : (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px 0' }}>
          Bạn chưa có ưu đãi nào khả dụng. Hãy tích lũy điểm để đổi thêm quà!
        </div>
      )}
    </div>
  );

  const renderAddresses = () => (
    <div>
      <div className="address-list">
        {addresses.map((item) => (
          <div key={item.id} className="address-item-premium">
            <div className="address-item-details">
              <span className="address-item-tag">{item.tag}</span>
              <span className="address-item-text">{item.detail}</span>
            </div>
            <button 
              className="address-delete-btn"
              onClick={() => handleDeleteAddress(item.id)}
              title="Xóa địa chỉ"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        ))}
        {addresses.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '16px 0', fontSize: '14px' }}>
            Chưa có địa chỉ nào được lưu.
          </div>
        )}
      </div>

      <form onSubmit={handleAddAddress} className="address-form">
        <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>Thêm địa chỉ mới</div>
        
        <div className="address-input-group">
          <label>Tên gợi nhớ (ví dụ: Nhà riêng, Công ty...)</label>
          <input 
            type="text" 
            className="address-input" 
            placeholder="Nhập tên nhãn địa chỉ" 
            value={newTag} 
            onChange={e => setNewTag(e.target.value)}
            required
          />
        </div>

        <div className="address-input-group">
          <label>Địa chỉ chi tiết</label>
          <input 
            type="text" 
            className="address-input" 
            placeholder="Số nhà, tên đường, phường/xã..." 
            value={newDetail} 
            onChange={e => setNewDetail(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="address-submit-btn">
          Lưu địa chỉ
        </button>
      </form>
    </div>
  );

  const renderSupport = () => (
    <div className="contact-list">
      <a href="tel:19006789" className="contact-card-premium">
        <div className="contact-card-icon">📞</div>
        <div className="contact-card-info">
          <span className="contact-card-label">Hotline chăm sóc khách hàng</span>
          <span className="contact-card-value">1900 6789 (1.000đ/phút)</span>
        </div>
      </a>

      <a href="mailto:support@serenebrews.com" className="contact-card-premium">
        <div className="contact-card-icon">✉️</div>
        <div className="contact-card-info">
          <span className="contact-card-label">Gửi Email hỗ trợ</span>
          <span className="contact-card-value">support@serenebrews.com</span>
        </div>
      </a>

      <div className="contact-card-premium" style={{ cursor: 'default' }}>
        <div className="contact-card-icon">🕒</div>
        <div className="contact-card-info">
          <span className="contact-card-label">Thời gian làm việc</span>
          <span className="contact-card-value">07:00 - 22:00 hàng ngày</span>
        </div>
      </div>

      <div 
        className="contact-card-premium" 
        onClick={() => showToast('💬 Đang kết nối tới kênh hỗ trợ Zalo OA...')}
      >
        <div className="contact-card-icon">💬</div>
        <div className="contact-card-info">
          <span className="contact-card-label">Trò chuyện Zalo OA</span>
          <span className="contact-card-value">Hỗ trợ nhanh chóng 24/7</span>
        </div>
      </div>
    </div>
  );

  const renderTerms = () => (
    <div className="terms-panel">
      <div>
        <div className="terms-section-title">1. Giới thiệu dịch vụ</div>
        <div className="terms-section-content">
          Chào mừng bạn đến với Serene Brews - Zalo Mini App đặt đồ uống. Bằng việc sử dụng ứng dụng, bạn đồng ý tuân thủ các điều khoản hoạt động của chúng tôi.
        </div>
      </div>

      <div>
        <div className="terms-section-title">2. Điểm tích lũy thành viên</div>
        <div className="terms-section-content">
          Điểm tích lũy (10.000đ = 1 điểm) dùng để nâng cấp hạng thẻ thành viên và đổi các Voucher ưu đãi. Điểm không có giá trị quy đổi thành tiền mặt.
        </div>
      </div>

      <div>
        <div className="terms-section-title">3. Chính sách đặt hàng theo nhóm</div>
        <div className="terms-section-content">
          Đặt nhóm cho phép nhiều người dùng thêm món vào chung một giỏ hàng. Trưởng nhóm chịu trách nhiệm chốt đơn và thanh toán toàn bộ giá trị đơn hàng.
        </div>
      </div>

      <div>
        <div className="terms-section-title">4. Bảo mật thông tin</div>
        <div className="terms-section-content">
          Serene Brews cam kết bảo mật tuyệt đối thông tin định danh của người dùng (tên hiển thị, avatar, số điện thoại) phục vụ riêng cho việc hoàn tất giao nhận đơn hàng.
        </div>
      </div>
    </div>
  );

  const renderDrawerShell = (title: string, isOpen: boolean, onClose: () => void, children: React.ReactNode) => {
    if (!isOpen) return null;
    return (
      <>
        <div className="drawer-backdrop" onClick={onClose} />
        <div className="drawer-container">
          <div className="drawer-handle-bar" onClick={onClose}>
            <div className="drawer-handle" />
          </div>
          <div className="drawer-header">
            <h3 className="drawer-title">{title}</h3>
            <button className="drawer-close-btn" onClick={onClose}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div className="drawer-content">
            {children}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="main-content" style={{ backgroundColor: '#FAF9F2', minHeight: '100vh', paddingBottom: '90px' }}>
      {/* Header */}
      <div className="page-header" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <button className="page-header-btn" onClick={() => {
          const groupRoom = router.query.groupRoom;
          if (groupRoom) {
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
        <div className="page-header-title">Profile</div>
        <div style={{ width: '40px' }}></div>
      </div>

      {/* Profile Hero */}
      <div className="profile-hero" style={{ paddingBottom: '16px' }}>
        <div className="profile-avatar" style={{ padding: zaloUser.avatar ? 0 : '8px' }}>
          {zaloUser.avatar ? (
            <img 
              src={zaloUser.avatar} 
              alt="Avatar" 
              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
            />
          ) : (
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2">
              <path d="M17 8h1a4 4 0 1 1 0 8h-1"/>
              <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/>
              <line x1="6" y1="2" x2="6" y2="4"/>
              <line x1="10" y1="2" x2="10" y2="4"/>
              <line x1="14" y1="2" x2="14" y2="4"/>
            </svg>
          )}
        </div>
        <div className="profile-name">{zaloUser.name}</div>
        <div className="profile-phone">{zaloUser.phone}</div>
      </div>

      {/* Membership Card */}
      <div style={{ padding: '0 24px', marginBottom: '24px' }}>
        <div style={{
          background: tier.gradient,
          color: tier.color,
          borderRadius: '24px',
          padding: '24px',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.12)',
          fontFamily: 'var(--font-sans)',
          position: 'relative',
          overflow: 'hidden',
          minHeight: '160px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          {/* Decorative circles */}
          <div style={{
            position: 'absolute',
            right: '-20px',
            bottom: '-20px',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            pointerEvents: 'none'
          }} />
          <div style={{
            position: 'absolute',
            right: '40px',
            bottom: '40px',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            pointerEvents: 'none'
          }} />

          {/* Card Top */}
          <div style={{ display: 'flex', justifySelf: 'flex-start', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '2px', opacity: 0.9 }}>
                SERENE BREWS CLUB
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '6px', letterSpacing: '0.5px' }}>
                {tier.name}
              </div>
            </div>
            <div style={{
              width: '36px',
              height: '24px',
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              ☕
            </div>
          </div>

          {/* Card Bottom */}
          <div style={{ zIndex: 1, marginTop: '28px' }}>
            <div style={{ fontSize: '12px', fontWeight: 500, opacity: 0.85 }}>
              Mã thành viên: SB-{100000 + loyaltyPoints}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '4px' }}>
              <div style={{ fontSize: '18px', fontWeight: 700 }}>
                {zaloUser.name}
              </div>
              <div style={{ fontSize: '20px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px' }}>
                ★ {loyaltyPoints} <span style={{ fontSize: '12px', fontWeight: 600 }}>Điểm</span>
              </div>
            </div>
          </div>
        </div>

        {/* Small Progress message under card */}
        <div style={{ 
          textAlign: 'center', 
          fontSize: '12px', 
          color: 'var(--text-secondary)', 
          marginTop: '10px',
          fontFamily: 'var(--font-sans)',
          fontWeight: 500
        }}>
          {tier.sub}
        </div>
      </div>

      {/* Profile Menu List */}
      <div className="profile-menu">
        {menuItems.map((item, idx) => (
          <div key={idx} className="profile-menu-item" onClick={item.action}>
            <div className="profile-menu-item-left">
              <span className="profile-menu-icon" style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
            <span className="profile-menu-arrow" style={{ display: 'flex', alignItems: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </span>
          </div>
        ))}
      </div>

      {/* Drawer Sheets */}
      {activeModal === 'vouchers' && renderDrawerShell('Ưu đãi của tôi', true, () => setActiveModal(null), renderVouchers())}
      {activeModal === 'addresses' && renderDrawerShell('Địa chỉ đã lưu', true, () => setActiveModal(null), renderAddresses())}
      {activeModal === 'support' && renderDrawerShell('Liên hệ hỗ trợ', true, () => setActiveModal(null), renderSupport())}
      {activeModal === 'terms' && renderDrawerShell('Điều khoản dịch vụ', true, () => setActiveModal(null), renderTerms())}
      {activeModal === 'lucky-wheel' && renderDrawerShell('Vòng quay may mắn', true, () => {
        if (!isSpinning) {
          setActiveModal(null);
          setSpinResult(null);
        }
      }, renderLuckyWheel())}

      {/* Navigation */}
      <BottomNav activeTab="profile" />
    </div>
  );
}
