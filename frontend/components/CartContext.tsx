import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  isBestSeller?: boolean;
}

export interface CartItem {
  cartId: string; // ProductID + Size + Sweetness + Ice + Note (encoded)
  product: Product;
  size: 'M' | 'L';
  sweetness: '0%' | '50%' | '100%';
  ice: '0%' | '50%' | '100%';
  note: string;
  quantity: number;
  singlePrice: number;
}

export interface Voucher {
  code: string;
  description: string;
  discountType: 'fixed' | 'percentage';
  discountValue: number;
  minSubtotal: number;
}

interface CartContextType {
  products: Product[];
  cart: CartItem[];
  addToCart: (product: Product, size: 'M' | 'L', sweetness: '0%' | '50%' | '100%', ice: '0%' | '50%' | '100%', note: string, quantity: number) => void;
  removeFromCart: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  discount: number;
  total: number;
  fetchProducts: () => Promise<void>;
  loading: boolean;
  activeStore: string;
  setActiveStore: (store: string) => void;
  zaloUser: ZaloUser;
  favorites: number[];
  toggleFavorite: (productId: number) => void;
  isFavorite: (productId: number) => boolean;
  availableVouchers: Voucher[];
  selectedVoucher: Voucher | null;
  applyVoucher: (code: string) => boolean;
  removeVoucher: () => void;
  loyaltyPoints: number;
  addPoints: (pts: number) => void;
  spendPoints: (pts: number, voucherCode: string) => boolean;
  unlockedVouchers: string[];
  hasUnreadNotifications: boolean;
  markNotificationsAsRead: () => void;
  setHasUnreadNotifications: (val: boolean) => void;
  showToast: (msg: string) => void;
  showDialog: (msg: string, onConfirm?: () => void, isConfirm?: boolean) => void;
}

export interface ZaloUser {
  name: string;
  avatar: string;
  phone: string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const defaultVouchers: Voucher[] = [
  {
    code: 'SERENE15',
    description: 'Giảm 15k cho đơn từ 100k',
    discountType: 'fixed',
    discountValue: 15000,
    minSubtotal: 100000
  },
  {
    code: 'SERENE50',
    description: 'Giảm 50k cho đơn từ 200k',
    discountType: 'fixed',
    discountValue: 50000,
    minSubtotal: 200000
  },
  {
    code: 'COFFEEGO',
    description: 'Giảm 10% tổng đơn hàng',
    discountType: 'percentage',
    discountValue: 10,
    minSubtotal: 0
  },
  {
    code: 'FREESHIP',
    description: 'Freeship - Giảm 20k đơn hàng',
    discountType: 'fixed',
    discountValue: 20000,
    minSubtotal: 50000
  }
];

// Sample fallback products matching images
const defaultProducts: Product[] = [
  {
    id: 1,
    name: 'Matcha Cloud Latte',
    price: 65000,
    image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&q=80&w=400',
    category: 'Signature',
    description: 'Trà xanh thượng hạng hòa quyện với lớp kem béo ngậy tạo ra hương vị êm ái như những đám mây đầu mùa.',
    isBestSeller: true,
  },
  {
    id: 2,
    name: 'Trà Oolong Đào Tiên',
    price: 55000,
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=400',
    category: 'Thanh lọc cơ thể',
    description: 'Sự kết hợp hoàn hảo giữa lá trà oolong cao cấp và đào tiên mọng nước ngọt ngào.',
  },
  {
    id: 3,
    name: 'Cold Brew Mè Đen',
    price: 70000,
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=400',
    category: 'Signature',
    description: 'Cà phê ủ lạnh thanh mát kết hợp với kem foam mè đen thơm lừng độc đáo.',
  },
  {
    id: 4,
    name: 'Trà Hoa Cúc Yên Thảo',
    price: 50000,
    image: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&q=80&w=400',
    category: 'Thanh lọc cơ thể',
    description: 'Trà hoa cúc khô nguyên bông mang lại vị thanh khiết, thư giãn đầu óc sau ngày dài mỏi mệt.',
  },
  {
    id: 5,
    name: 'Trà Vải Lài Bình Yên',
    price: 55000,
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=400',
    category: 'Thanh lọc cơ thể',
    description: 'Sự kết hợp nhẹ nhàng giữa trà lài thơm ngát và vị ngọt thanh của vải thiều tươi, mang đến cảm giác thanh bình như một sớm mai tĩnh lặng.',
    isBestSeller: true,
  },
  {
    id: 6,
    name: 'Almond Croissant',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=400',
    category: 'Ngọt ngào',
    description: 'Bánh sừng bò ngập nhân hạnh nhân, giòn rụm bên ngoài và mềm xốp bên trong.',
  },
  {
    id: 7,
    name: 'Espresso Cream Macchiato',
    price: 60000,
    image: 'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?auto=format&fit=crop&q=80&w=400',
    category: 'Signature',
    description: 'Cà phê Espresso đậm đà với lớp bọt sữa Macchiato béo mịn ngọt ngào phủ bên trên.',
    isBestSeller: true,
  },
  {
    id: 8,
    name: 'Sea Salt Caramel Latte',
    price: 65000,
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=400',
    category: 'Signature',
    description: 'Sự kết hợp ngọt ngào của caramel hòa quyện cùng chút muối biển tinh tế và espresso sữa nóng.',
  },
  {
    id: 9,
    name: 'Coconut Milk Cold Brew',
    price: 70000,
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=400',
    category: 'Signature',
    description: 'Cà phê Cold Brew ủ lạnh thanh thoát hòa cùng sữa dừa sánh mịn, thơm lừng béo ngậy.',
    isBestSeller: true,
  },
  {
    id: 10,
    name: 'Hazelnut Latte Foam',
    price: 65000,
    image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=400',
    category: 'Signature',
    description: 'Sự quyến rũ đặc biệt của hạt dẻ hazelnut thơm bùi quyện trong tách espresso latte ấm áp.',
  },

  {
    id: 12,
    name: 'Trà Đào Cam Sả Tiên Cảnh',
    price: 55000,
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=400',
    category: 'Thanh lọc cơ thể',
    description: 'Trà đào truyền thống nâng tầm với cam vàng Mỹ ngọt mát và sả tươi đập dập thơm lừng giải nhiệt.',
    isBestSeller: true,
  },
  {
    id: 13,
    name: 'Trà Dâu Tây Đá Tuyết',
    price: 60000,
    image: 'https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&q=80&w=400',
    category: 'Thanh lọc cơ thể',
    description: 'Dâu tây Đà Lạt xay đá tuyết mát lạnh sảng khoái kết hợp với cốt trà lài thanh tao nhẹ nhàng.',
  },
  {
    id: 14,
    name: 'Trà Xanh Bạc Hà Thanh Mát',
    price: 50000,
    image: 'https://images.unsplash.com/photo-1563822249548-9a72b6353cd1?auto=format&fit=crop&q=80&w=400',
    category: 'Thanh lọc cơ thể',
    description: 'Những lá bạc hà tươi giã nhẹ quyện trong trà xanh thượng hạng mang lại sự bừng tỉnh tức thì.',
  },
  {
    id: 15,
    name: 'Trà Sen Tây Hồ Tĩnh Lặng',
    price: 50000,
    image: 'https://images.unsplash.com/photo-1576092762841-df07d9d9611a?auto=format&fit=crop&q=80&w=400',
    category: 'Thanh lọc cơ thể',
    description: 'Mùi sen Tây Hồ dịu dàng ướp tinh tế trong từng lá trà xanh mang lại cảm giác bình yên thư thái.',
  },
  {
    id: 16,
    name: 'Nước Ép Thơm Ổi Hồng',
    price: 55000,
    image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&q=80&w=400',
    category: 'Thanh lọc cơ thể',
    description: 'Nước ép nguyên chất từ dứa chín mọng nước kết hợp ổi hồng thơm mát giàu vitamin C.',
  },
  {
    id: 17,
    name: 'Trà Hibiscus Hạt Chia',
    price: 55000,
    image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=400',
    category: 'Thanh lọc cơ thể',
    description: 'Sắc đỏ kiêu kỳ của hoa Hibiscus chua nhẹ thanh mát kết hợp hạt chia nhai sần sật vui miệng.',
  },
  {
    id: 18,
    name: 'Trà Sữa Oolong Nhài',
    price: 60000,
    image: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&q=80&w=400',
    category: 'Thanh lọc cơ thể',
    description: 'Cốt trà oolong nhài đậm vị hòa quyện cùng sữa béo thơm dịu mát khó quên.',
    isBestSeller: true,
  },
  {
    id: 19,
    name: 'Trà Vải Hạt Chia',
    price: 55000,
    image: 'https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&q=80&w=400',
    category: 'Thanh lọc cơ thể',
    description: 'Trà vải ngọt ngào giòn sần sật của trái vải ngâm cùng hạt chia dồi dào dinh dưỡng.',
  },
  {
    id: 20,
    name: 'Chocolate Croissant',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&q=80&w=400',
    category: 'Ngọt ngào',
    description: 'Bánh sừng bò ngập nhân sô cô la bỉ chảy lỏng, vỏ ngoài giòn rụm ngây ngất.',
    isBestSeller: true,
  },
  {
    id: 21,
    name: 'Butter Waffle',
    price: 40000,
    image: 'https://images.unsplash.com/photo-1562376502-6f769499c886?auto=format&fit=crop&q=80&w=400',
    category: 'Ngọt ngào',
    description: 'Bánh tổ ong nướng bơ tỏi thơm lừng giòn ngọt, tuyệt vời khi dùng nóng.',
  },
  {
    id: 22,
    name: 'Tiramisu Cup',
    price: 55000,
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&q=80&w=400',
    category: 'Ngọt ngào',
    description: 'Bánh tiramisu truyền thống của Ý đượm vị rượu rum quyện kem cheese béo ngậy.',
    isBestSeller: true,
  },
  {
    id: 23,
    name: 'Blueberry Cheesecake',
    price: 60000,
    image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&q=80&w=400',
    category: 'Ngọt ngào',
    description: 'Bánh phô mai nướng đế quy giòn kết hợp mứt việt quất tươi chua ngọt đậm đà.',
  },
  {
    id: 24,
    name: 'Matcha Cookie',
    price: 35000,
    image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&q=80&w=400',
    category: 'Ngọt ngào',
    description: 'Bánh quy trà xanh giòn xốp rắc thêm hạnh nhân lát thơm bùi ngọt dịu.',
  },
  {
    id: 25,
    name: 'Red Velvet Slice',
    price: 55000,
    image: 'https://images.unsplash.com/photo-1616260828576-9542a44487da?auto=format&fit=crop&q=80&w=400',
    category: 'Ngọt ngào',
    description: 'Lát bánh bông lan nhung đỏ quyến rũ xen kẽ lớp kem phô mai chua nhẹ ngọt ngào.',
  },
  {
    id: 26,
    name: 'Macaron Set (3pcs)',
    price: 65000,
    image: 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?auto=format&fit=crop&q=80&w=400',
    category: 'Ngọt ngào',
    description: 'Hộp 3 bánh macaron nhiều màu sắc với các nhân dâu, trà xanh và sô cô la ngọt dịu.',
    isBestSeller: true,
  }
];

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>(defaultVouchers);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeStore, setActiveStore] = useState('Quận 1');
  const [zaloUser, setZaloUser] = useState<ZaloUser>({
    name: 'Khách Hàng Serene',
    avatar: '',
    phone: '0936 433 234'
  });

  const [isCartLoaded, setIsCartLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('serene_cart');
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart));
        } catch (e) {
          console.error('Error parsing cart from localStorage', e);
        }
      }
      setIsCartLoaded(true);
    }
  }, []);

  // Save to localStorage whenever cart changes, but ONLY after it has been loaded
  useEffect(() => {
    if (isCartLoaded && typeof window !== 'undefined') {
      localStorage.setItem('serene_cart', JSON.stringify(cart));
    }
  }, [cart, isCartLoaded]);

  const [favorites, setFavorites] = useState<number[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);

  // Loyalty states
  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(0);
  const [unlockedVouchers, setUnlockedVouchers] = useState<string[]>(['SERENE15']); // SERENE15 is unlocked by default
  const [isLoyaltyLoaded, setIsLoyaltyLoaded] = useState(false);

  // Load loyalty states from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPts = localStorage.getItem('serene_points');
      if (savedPts) setLoyaltyPoints(Number(savedPts));
      
      const savedVouchers = localStorage.getItem('serene_unlocked_vouchers');
      if (savedVouchers) setUnlockedVouchers(JSON.parse(savedVouchers));
      
      setIsLoyaltyLoaded(true);
    }
  }, []);

  // Save loyalty states to localStorage
  useEffect(() => {
    if (isLoyaltyLoaded && typeof window !== 'undefined') {
      localStorage.setItem('serene_points', String(loyaltyPoints));
      localStorage.setItem('serene_unlocked_vouchers', JSON.stringify(unlockedVouchers));
    }
  }, [loyaltyPoints, unlockedVouchers, isLoyaltyLoaded]);

  const addPoints = (pts: number) => {
    setLoyaltyPoints(prev => prev + pts);
  };

  const spendPoints = (pts: number, code: string): boolean => {
    if (loyaltyPoints >= pts) {
      setLoyaltyPoints(prev => prev - pts);
      if (code) {
        setUnlockedVouchers(prev => {
          if (prev.includes(code)) return prev;
          return [...prev, code];
        });
      }
      return true;
    }
    return false;
  };

  // Notifications unread state
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState<boolean>(true);
  const [isNotificationsLoaded, setIsNotificationsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUnread = localStorage.getItem('serene_unread_notifications');
      if (savedUnread !== null) {
        setHasUnreadNotifications(savedUnread === 'true');
      }
      setIsNotificationsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isNotificationsLoaded && typeof window !== 'undefined') {
      localStorage.setItem('serene_unread_notifications', String(hasUnreadNotifications));
    }
  }, [hasUnreadNotifications, isNotificationsLoaded]);

  const markNotificationsAsRead = () => {
    setHasUnreadNotifications(false);
  };

  // Global Toast and Dialog States
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [dialogConfig, setDialogConfig] = useState<{ message: string; onConfirm?: () => void; isConfirm: boolean } | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(prev => prev === msg ? null : prev);
    }, 2500);
  };

  const showDialog = (msg: string, onConfirm?: () => void, isConfirm = false) => {
    setDialogConfig({ message: msg, onConfirm, isConfirm });
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('serene_favorites');
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    }
  }, []);

  const toggleFavorite = (productId: number) => {
    setFavorites(prev => {
      const next = prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
      if (typeof window !== 'undefined') {
        localStorage.setItem('serene_favorites', JSON.stringify(next));
      }
      return next;
    });
  };

  const isFavorite = (productId: number) => {
    return favorites.includes(productId);
  };

  // Attempt to fetch from Backend API, fallback to mock if unreachable
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/products');
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setProducts(data);
        }
      }
    } catch (error) {
      console.log('Backend not started yet or unreachable, using default mock data.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch vouchers list from backend MySQL
  const fetchVouchers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/vouchers');
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setAvailableVouchers(data);
        }
      }
    } catch (error) {
      console.log('Backend vouchers unavailable, using fallbacks.');
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchVouchers();
    
    // Fetch Zalo User Info if running inside Zalo App environment
    if (typeof window !== 'undefined') {
      try {
        const { getUserInfo } = require('zmp-sdk/apis');
        getUserInfo({
          success: (data: any) => {
            if (data && data.userInfo) {
              setZaloUser({
                name: data.userInfo.name || 'Khách Hàng Zalo',
                avatar: data.userInfo.avatar || '',
                phone: '0936 433 234' // default mock phone number
              });
            }
          },
          fail: (error: any) => {
            console.log('Zalo SDK getUserInfo failed, using mock data.', error);
          }
        });
      } catch (e) {
        console.log('zmp-sdk/apis not available or error, running in browser mock mode.');
      }
    }
  }, []);

  const addToCart = (
    product: Product,
    size: 'M' | 'L',
    sweetness: '0%' | '50%' | '100%',
    ice: '0%' | '50%' | '100%',
    note: string,
    quantity: number
  ) => {
    // Generate unique ID based on product and selected options
    const normalizedNote = note.trim().toLowerCase();
    const cartId = `${product.id}-${size}-${sweetness}-${ice}-${normalizedNote}`;
    
    // Size L costs 10,000đ extra
    const singlePrice = size === 'L' ? product.price + 10000 : product.price;

    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(item => item.cartId === cartId);
      if (existingItemIndex > -1) {
        const newCart = [...prevCart];
        newCart[existingItemIndex].quantity += quantity;
        return newCart;
      } else {
        return [...prevCart, { cartId, product, size, sweetness, ice, note, quantity, singlePrice }];
      }
    });
  };

  const removeFromCart = (cartId: string) => {
    setCart(prevCart => prevCart.filter(item => item.cartId !== cartId));
  };

  const updateQuantity = (cartId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item => (item.cartId === cartId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => setCart([]);

  // Calculate prices
  const subtotal = cart.reduce((sum, item) => sum + item.singlePrice * item.quantity, 0);
  
  // If subtotal drops below the minimum required for the selected voucher, remove it
  useEffect(() => {
    if (selectedVoucher && subtotal < selectedVoucher.minSubtotal) {
      setSelectedVoucher(null);
    }
  }, [subtotal, selectedVoucher]);

  const applyVoucher = (code: string): boolean => {
    const voucher = availableVouchers.find(v => v.code.toUpperCase() === code.toUpperCase());
    if (voucher && subtotal >= voucher.minSubtotal) {
      setSelectedVoucher(voucher);
      return true;
    }
    return false;
  };

  const removeVoucher = () => {
    setSelectedVoucher(null);
  };

  // Calculate discount based on selected voucher
  let discount = 0;
  if (selectedVoucher) {
    if (selectedVoucher.discountType === 'fixed') {
      discount = selectedVoucher.discountValue;
    } else if (selectedVoucher.discountType === 'percentage') {
      discount = Math.round((subtotal * selectedVoucher.discountValue) / 100);
    }
  }
  
  const total = Math.max(0, subtotal - discount);

  return (
    <CartContext.Provider value={{
      products,
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      subtotal,
      discount,
      total,
      fetchProducts,
      loading,
      activeStore,
      setActiveStore,
      zaloUser,
      favorites,
      toggleFavorite,
      isFavorite,
      availableVouchers,
      selectedVoucher,
      applyVoucher,
      removeVoucher,
      loyaltyPoints,
      addPoints,
      spendPoints,
      unlockedVouchers,
      hasUnreadNotifications,
      markNotificationsAsRead,
      setHasUnreadNotifications,
      showToast,
      showDialog
    }}>
      {children}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          bottom: '95px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(46, 45, 41, 0.95)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: 500,
          zIndex: 99999,
          boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
          textAlign: 'center',
          fontFamily: 'var(--font-sans)',
          animation: 'sereneFadeIn 0.3s ease',
          whiteSpace: 'nowrap'
        }}>
          {toastMsg}
        </div>
      )}

      {dialogConfig && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999,
          fontFamily: 'var(--font-sans)'
        }}>
          <div style={{
            backgroundColor: '#FAF9F2',
            width: '85%',
            maxWidth: '320px',
            padding: '24px',
            borderRadius: '24px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            textAlign: 'center',
            border: '1px solid var(--border-color)',
            animation: 'sereneSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)' }}>
              {dialogConfig.isConfirm ? 'Xác nhận' : 'Thông báo'}
            </h4>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '20px' }}>
              {dialogConfig.message}
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              {dialogConfig.isConfirm && (
                <button
                  onClick={() => setDialogConfig(null)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--white)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                >
                  Hủy
                </button>
              )}
              <button
                onClick={() => {
                  if (dialogConfig.onConfirm) {
                    dialogConfig.onConfirm();
                  }
                  setDialogConfig(null);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: 'var(--primary-color)',
                  color: 'white',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '14px',
                  outline: 'none'
                }}
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
