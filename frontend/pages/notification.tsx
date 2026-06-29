import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { BottomNav } from '@/components/BottomNav';
import { useCart } from '@/components/CartContext';

interface NotificationItem {
  id: number;
  title: string;
  body: string;
  time: string;
  type: 'promo' | 'system' | 'order';
  unread: boolean;
}

export default function NotificationPage() {
  const router = useRouter();
  const { loyaltyPoints, setHasUnreadNotifications } = useCart();
  const groupRoom = router.query.groupRoom as string;

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('serene_notifications_list');
      if (saved) {
        setNotifications(JSON.parse(saved));
      } else {
        const defaultList: NotificationItem[] = [
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
        setNotifications(defaultList);
      }
      setIsLoaded(true);
    }
  }, []);

  const [hasUnread, setHasUnread] = useState(true);

  useEffect(() => {
    if (isLoaded) {
      setHasUnread(notifications.some(n => n.unread));
      if (typeof window !== 'undefined') {
        localStorage.setItem('serene_notifications_list', JSON.stringify(notifications));
      }
      setHasUnreadNotifications(notifications.some(n => n.unread));
    }
  }, [notifications, isLoaded, setHasUnreadNotifications]);

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'promo':
        return (
          <div style={{
            backgroundColor: 'var(--primary-light)',
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 12v10H4V12"/>
              <path d="M2 7h20v5H2z"/>
              <path d="M12 22V7"/>
              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
            </svg>
          </div>
        );
      case 'order':
        return (
          <div style={{
            backgroundColor: '#EBF2FC',
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B72C4" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          </div>
        );
      case 'system':
      default:
        return (
          <div style={{
            backgroundColor: 'rgba(94, 88, 66, 0.08)',
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="main-content" style={{ backgroundColor: '#FAF9F2', minHeight: '100vh', paddingBottom: '90px' }}>
      {/* Header */}
      <div className="page-header" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <button className="page-header-btn" onClick={() => {
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
        <div className="page-header-title">Thông báo</div>
        <button 
          onClick={handleMarkAllRead}
          disabled={!hasUnread}
          style={{
            background: 'none',
            border: 'none',
            color: hasUnread ? 'var(--primary-color)' : 'var(--text-secondary)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: hasUnread ? 'pointer' : 'default',
            padding: '4px 8px'
          }}
        >
          Đọc tất cả
        </button>
      </div>

      {/* Notifications List */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px', fontFamily: 'var(--font-sans)' }}>
        {notifications.map((notif) => (
          <div 
            key={notif.id}
            onClick={() => {
              if (notif.unread) {
                setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, unread: false } : n));
              }
              if (notif.type === 'order') {
                const targetUrl = groupRoom ? `/history?groupRoom=${groupRoom}` : '/history';
                router.push(targetUrl);
              }
            }}
            style={{
              backgroundColor: 'var(--white)',
              borderRadius: '20px',
              border: notif.unread ? '1px solid rgba(94, 88, 66, 0.2)' : '1px solid var(--border-color)',
              padding: '16px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
              cursor: 'pointer',
              position: 'relative',
              boxShadow: notif.unread ? '0 4px 15px rgba(94, 88, 66, 0.04)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            {/* Unread indicator dot */}
            {notif.unread && (
              <span style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#E05C5C'
              }} />
            )}

            {/* Icon */}
            {getNotificationIcon(notif.type)}

            {/* Content */}
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 700, 
                color: 'var(--text-primary)',
                paddingRight: notif.unread ? '12px' : '0'
              }}>
                {notif.title}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.4' }}>
                {notif.body}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '8px', fontWeight: 500 }}>
                {notif.time}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <BottomNav activeTab="notifications" />
    </div>
  );
}
