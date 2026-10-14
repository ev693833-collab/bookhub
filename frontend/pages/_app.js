import '../styles/globals.css'
import { useAuth } from '../utils/auth'
import setupAxiosInterceptors from '../utils/axiosInterceptor'
import Head from 'next/head';
import { useEffect } from 'react'

export default function App({ Component, pageProps }) {
  const auth = useAuth()

  // Configurar interceptors do axios uma vez
  useEffect(() => {
    setupAxiosInterceptors();
  }, []);

  return (
    <div>
      <Head>
        <title>DevSongs — O Player de Música para Devs</title>
        <link rel="icon" href="/favicon.png" type="image/png" />
      </Head>
      <Component {...pageProps} auth={auth} />
    </div>
  )
}
