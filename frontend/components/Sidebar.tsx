import React from 'react';
import { useRouter } from 'next/router';
import { useCart } from './CartContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const { activeStore, setActiveStore, zaloUser, loyaltyPoints, showToast } = useCart();

  const getTier = (pts: number) => {
    if (pts >= 300) return { name: 'Hạng Vàng (Gold)', color: 'var(--primary-color)' };
    if (pts >= 100) return { name: 'Hạng Bạc (Silver)', color: '#7E8B9B' };
    return { name: 'Hạng Đồng (Bronze)', color: '#A05C33' };
  };

  const tier = getTier(loyaltyPoints);

  const branches = [
    { name: 'Quận 1', address: '120 Lê Lợi, P. Bến Thành, Q.1', distance: '1.2 km' },
    { name: 'Bình Thạnh', address: '45 Điện Biên Phủ, P.25, Q. Bình Thạnh', distance: '3.5 km' },
    { name: 'Quận 3', address: '88 Nguyễn Đình Chiểu, P.6, Q.3', distance: '4.8 km' }
  ];

  const vouchers = [
    { code: 'SERENE15', desc: 'Giảm 15k đơn từ 100k' },
    { code: 'FREESHIP', desc: 'Miễn phí giao hàng' }
  ];

  const savedAddresses = [
    { label: 'Nhà riêng', addr: '123 Nguyễn Thị Minh Khai, Q.1' },
    { label: 'Công ty', addr: '456 Lê Lợi, Q.1' }
  ];

  const handleBranchSelect = (branchName: string) => {
    setActiveStore(branchName);
    onClose();
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast(`🎫 Đã sao chép mã khuyến mãi: ${code}`);
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        display: 'flex',
        fontFamily: 'var(--font-sans)'
      }}
    >
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(46, 45, 41, 0.4)',
          backdropFilter: 'blur(2px)',
          animation: 'fadeIn 0.25s ease-out'
        }}
      />

      {/* Drawer Content */}
      <div 
        style={{
          position: 'relative',
          width: '290px',
          height: '100%',
          backgroundColor: 'var(--bg-color)',
          boxShadow: '4px 0 25px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideIn 0.25s ease-out',
          zIndex: 1001,
          overflowY: 'auto'
        }}
      >
        {/* User Profile Summary */}
        <div 
          style={{
            backgroundColor: 'var(--primary-light)',
            padding: '28px 20px 20px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div 
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: 'var(--white)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--primary-color)',
              overflow: 'hidden',
              padding: zaloUser.avatar ? 0 : '8px'
            }}
          >
            {zaloUser.avatar ? (
              <img 
                src={zaloUser.avatar} 
                alt="Avatar" 
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
              />
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2.2">
                <path d="M17 8h1a4 4 0 1 1 0 8h-1"/>
                <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/>
                <line x1="6" y1="2" x2="6" y2="4"/>
                <line x1="10" y1="2" x2="10" y2="4"/>
                <line x1="14" y1="2" x2="14" y2="4"/>
              </svg>
            )}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)' }}>{zaloUser.name}</div>
            <div 
              style={{ 
                fontSize: '11px', 
                backgroundColor: tier.color, 
                color: 'white', 
                padding: '2px 8px', 
                borderRadius: '8px',
                marginTop: '4px',
                display: 'inline-block',
                fontWeight: 500
              }}
            >
              {tier.name}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 500 }}>
              ★ {loyaltyPoints} Điểm tích lũy
            </div>
          </div>
        </div>

        {/* Store branches section */}
        <div style={{ padding: '20px 16px 12px 16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '1px', marginBottom: '10px' }}>
            Chọn Chi Nhánh ({activeStore})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {branches.map((b) => {
              const isSelected = activeStore === b.name;
              return (
                <div 
                  key={b.name}
                  onClick={() => handleBranchSelect(b.name)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '12px',
                    backgroundColor: isSelected ? 'var(--primary-color)' : 'var(--white)',
                    color: isSelected ? 'var(--white)' : 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, fontSize: '13px' }}>
                    <span>{b.name}</span>
                    <span style={{ fontSize: '10px', opacity: 0.8 }}>{b.distance}</span>
                  </div>
                  <div style={{ fontSize: '10px', marginTop: '3px', opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {b.address}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Promo vouchers */}
        <div style={{ padding: '8px 16px 12px 16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '1px', marginBottom: '10px' }}>
            Mã Khuyến Mãi Của Bạn
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {vouchers.map((v) => (
              <div 
                key={v.code}
                onClick={() => handleCopyCode(v.code)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--white)',
                  border: '1px dashed var(--primary-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary-color)' }}>{v.code}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{v.desc}</div>
                </div>
                <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)' }}>Copy 📋</div>
              </div>
            ))}
          </div>
        </div>

        {/* Saved Addresses */}
        <div style={{ padding: '8px 16px 12px 16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '1px', marginBottom: '10px' }}>
            Địa Chỉ Đã Lưu
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {savedAddresses.map((addr) => (
              <div 
                key={addr.label}
                style={{
                  padding: '10px 12px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--white)',
                  border: '1px solid var(--border-color)',
                  fontSize: '11px'
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>{addr.label}</div>
                <div style={{ color: 'var(--text-secondary)' }}>{addr.addr}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Shortcut to History */}
        <div style={{ padding: '8px 16px 20px 16px' }}>
          <button 
            onClick={() => {
              const groupRoom = router.query.groupRoom;
              if (groupRoom) {
                router.push(`/history?groupRoom=${groupRoom}`);
              } else {
                router.push('/history');
              }
              onClose();
            }}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              backgroundColor: 'var(--white)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-sans)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="16" height="20" x="4" y="2" rx="2"/>
                <line x1="8" x2="16" y1="6" y2="6"/>
                <line x1="8" x2="16" y1="10" y2="10"/>
                <line x1="8" x2="16" y1="14" y2="14"/>
              </svg>
              <span>Lịch sử đặt đơn</span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>➔</span>
          </button>
        </div>

        {/* Help footer */}
        <div 
          style={{
            marginTop: 'auto',
            padding: '20px 16px env(safe-area-inset-bottom) 16px',
            borderTop: '1px solid var(--border-color)',
            textAlign: 'center',
            fontSize: '12px',
            color: 'var(--text-secondary)'
          }}
        >
          <div>Hotline hỗ trợ: <strong>1900 6789</strong></div>
          <div style={{ fontSize: '10px', marginTop: '4px' }}>Phiên bản 1.0.0 • Serene Brews</div>
        </div>
      </div>

      {/* Animation Styles */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};
