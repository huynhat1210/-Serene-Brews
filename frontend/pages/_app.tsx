import type { AppProps } from 'next/app';
import Head from 'next/head';
import { CartProvider } from '@/components/CartContext';
import '@/styles/globals.css';
import 'zmp-ui/zaui.css'; // Import Zalo UI styles
import { useEffect } from 'react';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // If ZMP SDK is available, initialize it.
    // ZMP-UI runs inside Zalo app and requires ZMP Client SDK setup.
    if (typeof window !== 'undefined') {
      try {
        const zmp = require('zmp-sdk');
        // Initial configuration or setup if necessary
        console.log('Zalo Mini App SDK loaded successfully.');
      } catch (e) {
        console.log('Not running inside Zalo app Webview, bypassing ZMP SDK init.');
      }
    }
  }, []);

  return (
    <CartProvider>
      <Head>
        <title>Serene Brews</title>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="shortcut icon" href="/favicon.png" type="image/png" />
      </Head>
      <div className="app-container">
        <Component {...pageProps} />
      </div>
    </CartProvider>
  );
}
