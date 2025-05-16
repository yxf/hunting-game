'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from '../solana/solana-provider'
import { AppHero, ellipsify } from '../ui/ui-layout'
import { ExplorerLink } from '../cluster/cluster-ui'
import { useGameProgram } from './game-data-access'
import { GameInitialize, GameInitializeLpForTest, GameState } from './game-ui'

export default function GameFeature() {
  const { publicKey } = useWallet()
  const { programId } = useGameProgram()

  return publicKey ? (
    <div>
      <AppHero
        title="Hunting Game"
        subtitle={
          'Initialize the game by clicking the "Initialize" button.'
        }
      >
        <p className="mb-6">
          <ExplorerLink path={`account/${programId}`} label={ellipsify(programId.toString())} />
        </p>

        <div className="mb-6">
          <GameInitialize />
        </div>
        
        <div className="mb-6">
          <GameInitializeLpForTest />
        </div>

        <div className="mb-6">
          <GameState />
        </div>
      </AppHero>
    </div>
  ) : (
    <div className="max-w-4xl mx-auto">
      <div className="hero py-[64px]">
        <div className="hero-content text-center">
          <WalletButton />
        </div>
      </div>
    </div>
  )
}
