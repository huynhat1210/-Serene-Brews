import React from 'react';
import { useRouter } from 'next/router';
import { useCart } from './CartContext';

interface BottomNavProps {
  activeTab: 'home' | 'notifications' | 'orders' | 'profile';
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab }) => {
  const router = useRouter();
  const { cart, hasUnreadNotifications } = useCart();
  
  const cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);

  const navItems = [
    { 
      id: 'home', 
      label: 'Home', 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ), 
      path: '/' 
    },
    { 
      id: 'notifications', 
      label: 'Thông báo', 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      ), 
      path: '/notification' 
    },
    { 
      id: 'orders', 
      label: 'Orders', 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="16" height="20" x="4" y="2" rx="2"/>
          <line x1="8" x2="16" y1="6" y2="6"/>
          <line x1="8" x2="16" y1="10" y2="10"/>
          <line x1="8" x2="16" y1="14" y2="14"/>
        </svg>
      ), 
      path: '/order' 
    },
    { 
      id: 'profile', 
      label: 'Profile', 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      ), 
      path: '/profile' 
    }
  ];

  const handleNavigate = (path: string) => {
    const groupRoom = router.query.groupRoom;
    if (groupRoom) {
      const separator = path.includes('?') ? '&' : '?';
      router.push(`${path}${separator}groupRoom=${groupRoom}`);
    } else {
      router.push(path);
    }
  };

  return (
    <div className="bottom-nav">
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => handleNavigate(item.path)}
            className={`nav-item ${isActive ? 'active' : ''}`}
            style={{ position: 'relative' }}
          >
            <span className="nav-icon" style={{ fontSize: '24px' }}>
              {item.icon}
            </span>
            <span>{item.label}</span>
            {item.id === 'orders' && cartItemCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '25%',
                  backgroundColor: '#5E5842',
                  color: 'white',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  fontSize: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  border: '1.5px solid #FAF9F2'
                }}
              >
                {cartItemCount}
              </span>
            )}
            {item.id === 'notifications' && hasUnreadNotifications && (
              <span
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '30%',
                  backgroundColor: '#E05C5C',
                  borderRadius: '50%',
                  width: '8px',
                  height: '8px',
                  border: '1.5px solid #FAF9F2'
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};
