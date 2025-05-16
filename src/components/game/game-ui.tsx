'use client'

import { Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'
import { useMemo } from 'react'
import { ellipsify } from '../ui/ui-layout'
import { ExplorerLink } from '../cluster/cluster-ui'
import { useGameProgram } from './game-data-access'


export function GameInitialize() {
  const wallet = useWallet()
  const { initializeGame, gameState } = useGameProgram()
  const gameStateAccount = useMemo(() => {
  if (gameState.data && gameState.data.length > 0) {
      return gameState.data[0].account
  }
  return null
  }, [gameState.data])


  return (
    <>
    {
      !gameStateAccount?.gameInitialized ? 
      <button
        className="btn btn-xs lg:btn-md btn-primary"
        onClick={() => wallet.publicKey ? initializeGame.mutateAsync(wallet.publicKey) : null}
        disabled={initializeGame.isPending}
      >
        Initialize Game {initializeGame.isPending && '...'}
      </button>
      : null
    } 
    </>
  )
}

export function GameInitializeLpForTest() {
  const wallet = useWallet()
  const { initializeLpForTest, gameState } = useGameProgram()
  const gameStateAccount = useMemo(() => {
    if (gameState.data && gameState.data.length > 0) {
        return gameState.data[0].account
    }
    return null
  }, [gameState.data])

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() => wallet.publicKey ? initializeLpForTest.mutateAsync(wallet.publicKey) : null}
      disabled={initializeLpForTest.isPending}
    >
      Initialize Lp for test {initializeLpForTest.isPending && '...'}
    </button>
  )
}

export function GameState() {
  const wallet = useWallet()
  const { gameState } = useGameProgram()
  const gameStateAccount = useMemo(() => {
  if (gameState.data && gameState.data.length > 0) {
      return gameState.data[0].account
  }
  return null
  }, [gameState.data])

  console.log("gameState=", gameState.data)

  return (
    <div>
      <p className="mb-6">
        Hunters Minted: {gameStateAccount ? gameStateAccount?.huntersMinted.toNumber() : 0}
      </p>
      <p className="mb-6">
        Initialized: {gameStateAccount?.gameInitialized ? 'YES' : 'NO'}
      </p>

      <p className="mb-6">
        LP Initialized: {gameStateAccount?.lpInitialized ? 'YES' : 'NO'}
      </p>

      <p className="mb-6">
        Sol balance: <BalanceSol balance={gameStateAccount?.lpSolBalance.toNumber()} />
      </p>
    </div>
  )
}

function BalanceSol({ balance }: { balance?: number }) {
  return (
    <span>
      { balance ?
        Math.round((balance / LAMPORTS_PER_SOL) * 100000) / 100000
        : '--'
      } SOL
    </span>
  )
}