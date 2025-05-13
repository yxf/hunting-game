import './globals.css'
import {ClusterProvider} from '@/components/cluster/cluster-data-access'
import {SolanaProvider} from '@/components/solana/solana-provider'
import {UiLayout} from '@/components/ui/ui-layout'
import {ReactQueryProvider} from './react-query-provider'

export const metadata = {
  title: 'Hunting Game',
  description: 'A blockchain-based hunting game',
}

const links: { label: string; path: string }[] = [
  { label: 'Game Intro', path: '/game-intro' },
  { label: 'Hunter Minting', path: '/hunter-minting' },
  { label: 'Bears Market', path: '/bears-market' },
  { label: 'Hunt', path: '/hunt' },
  { label: 'Account', path: '/account' },
  // { label: 'Clusters', path: '/clusters' },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Underdog&display=swap" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: 'Underdog, system-ui', fontWeight: 400, fontStyle: 'normal' }}>
        <ReactQueryProvider>
          <ClusterProvider>
            <SolanaProvider>
              <UiLayout links={links}>{children}</UiLayout>
            </SolanaProvider>
          </ClusterProvider>
        </ReactQueryProvider>
      </body>
    </html>
  )
}
