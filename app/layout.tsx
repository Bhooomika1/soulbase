'use client'

import './globals.css'
import '@rainbow-me/rainbowkit/styles.css';
import { Inter } from 'next/font/google'
import { ThemeProvider } from "@/components/theme-provider"
import Link from 'next/link'
const inter = Inter({ subsets: ['latin'] })
import { ModeToggle } from '@/components/dropdown'
import { ChevronRight, Droplets, LogOut } from "lucide-react"
import { Button } from '@/components/ui/button'
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useNetwork, useSignMessage } from 'wagmi'
import { disconnect } from '@wagmi/core'
import { usePathname, useParams, useRouter } from 'next/navigation'
import { ExtendedSiweMessage } from '@/utils/ExtendedSiweMessage';
import { SessionProvider, getCsrfToken, signIn, signOut, useSession } from 'next-auth/react';
import * as React from 'react';
import {
  RainbowKitProvider,
  getDefaultWallets,
  connectorsForWallets,
  darkTheme,
  midnightTheme,
  lightTheme,
} from '@rainbow-me/rainbowkit';
import {
  okxWallet
} from '@rainbow-me/rainbowkit/wallets';
import { polygonZkEvmTestnet } from 'wagmi/chains';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [polygonZkEvmTestnet],
  [publicProvider()]
);

const projectId = '7d4991410483a2f943cd0f3e9bcf3c0d';

const { wallets } = getDefaultWallets({
  appName: 'soulbase',
  projectId,
  chains,
});

const demoAppInfo = {
  appName: 'soulbase',
};

const connectors = connectorsForWallets([
  ...wallets,
  {
    groupName: 'Other',
    wallets: [
      okxWallet({ projectId, chains }),
    ],
  },
]);

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

function AppWithProviders({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

function Nav() {
  const pathname = usePathname()
  const router = useRouter();
  const { data: session } = (useSession() || {}) as any;

  const { signMessageAsync } = useSignMessage();
  const { chain } = useNetwork();
  const { address, isConnected } = useAccount();

  const handleSignIn = React.useCallback(async () => {
    try {
      if (!address) {
        console.log('Ethereum account is not available.');
        return;
      }

      const userResponse = await fetch(`/api/user/${address}`);
      if (userResponse.status === 404) {
        router.push('/signup');
        return;
      }

      const callbackUrl = '/';
      const message = new ExtendedSiweMessage({
        domain: window.location.host,
        address: address,
        statement: 'Sign in to luxora',
        uri: window.location.origin,
        version: '1',
        chainId: chain?.id,
        nonce: await getCsrfToken(),
      });
      const signature = await signMessageAsync({
        message: message.prepareMessage(),
      });
      signIn('credentials', {
        message: JSON.stringify(message),
        redirect: false,
        signature,
        callbackUrl,
      });
    } catch (error) {
      console.log(error);
    }
  }, [address, router, chain?.id, signMessageAsync]);

  const handleSignOut = async () => {
    disconnect();
    await signOut({ redirect: false, callbackUrl: '/' });
  };

  return (
    <nav className='
    border-b flex
    flex-col sm:flex-row
    items-start sm:items-center
    sm:pr-10
    '>
      <div
        className='py-3 px-8 flex flex-1 items-center p'
      >
        <Link href="/" className='mr-5 flex items-center'>
          <Droplets className="opacity-85" size={19} />
          <p className={`ml-2 mr-4 text-lg font-semibold`}>luxora</p>
        </Link>
        <Link href="/" className={`mr-5 text-sm ${pathname !== '/' && 'opacity-50'}`}>
          <p>Home</p>
        </Link>
        <Link href="/search" className={`mr-5 text-sm ${pathname !== '/search' && 'opacity-60'}`}>
          <p>Search</p>
        </Link>
      </div>
      <div className='
        flex
        sm:items-center
        pl-8 pb-3 sm:p-0
      '>
        <div className='mr-3'>
          <ConnectButton showBalance={true} chainStatus="icon"/>
        </div>
        {
          !session && address && (
            <Button onClick={handleSignIn} variant="secondary" className="mr-4">
              Sign In
              <ChevronRight className="h-4 w-4" />
            </Button>
          )
        }
        {
          session && (
            <Button onClick={handleSignOut} variant="secondary" className="mr-4">
              Sign out
              <LogOut className="h-4 w-4 ml-3" />
            </Button>
          )
        }
        <ModeToggle />
      </div>
    </nav>
  )
}

export default function RootLayout({ children, session, ...props }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return (
    <SessionProvider>
      <WagmiConfig config={wagmiConfig}>
        <AppWithProviders {...props}>
          <RainbowKitProvider
            chains={chains}
            appInfo={demoAppInfo}
            modalSize="compact"
            theme={darkTheme({
              borderRadius: 'small',
              accentColor: '#603285',
              fontStack: 'system',
            })}
            coolMode
          >
            <Nav />
            {mounted && children}
          </RainbowKitProvider>
        </AppWithProviders>
      </WagmiConfig>
    </SessionProvider>
  )
}
