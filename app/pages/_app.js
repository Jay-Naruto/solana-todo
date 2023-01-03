import Head from 'next/head'
import '../styles/global.css'
// Import WalletConnectionProvider from components
// Import the solana wallet css
import '@solana/wallet-adapter-react-ui/styles.css'
import { WalletConnect } from '../components/WalletConnect'
function MyApp({ Component, pageProps }) {
    return (
        <>
            <Head>
                <title>Todo App</title>
            
            </Head>
            <main>
                {/* Wrap provider around App */}
                <WalletConnect>
                <Component {...pageProps} />

                </WalletConnect>
            </main>
        </>
    )
}

export default MyApp
