import '../styles/globals.css'
import { useAuth } from '../utils/auth'
import setupAxiosInterceptors from '../utils/axiosInterceptor'
import Head from 'next/head';
import { useEffect } from 'react'
import { ToastProvider } from '../context/ToastContext'
import LoginToast from '../components/Toast/LoginToast'

export default function App({ Component, pageProps }) {
  const auth = useAuth()

  // Configurar interceptors do axios uma vez
  useEffect(() => {
    setupAxiosInterceptors();
  }, []);

  return (
    <ToastProvider>
      <Head>
        <title>DevSongs — O Player de Música para Devs</title>
        <link rel="icon" href="https://res.cloudinary.com/z7j0hqnl/image/upload/v1793025191/bookhub/favicon.png" type="image/png" />
      </Head>
      <LoginToast />
      <Component {...pageProps} auth={auth} />
    </ToastProvider>
  )
}

