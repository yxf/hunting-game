'use client'

import { useState, useMemo } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { AppHero } from '../ui/ui-layout'
import Image from 'next/image'
import { useGameProgramMintHunter } from '../game/game-data-access'

export default function HunterMintingFeature() {
  const [mintCount, setMintCount] = useState(1)
  // const [totalMinted, setTotalMinted] = useState(356)
  const totalSupply = 1000
  const mintFee = 0.1 // SOL
  
  const {mintHunterMutation, gameState} = useGameProgramMintHunter({ count:  mintCount })

  const gameStateAccount = useMemo(() => {
    if (gameState.data && gameState.data.length > 0) {
        return gameState.data[0].account
    }
    return null
    }, [gameState.data]
  )

  // console.log("gameStateAccount=", gameStateAccount?.lpSolBalance.toString())

  const totalMinted = gameStateAccount?.huntersMinted.toNumber() || 0

  const handleMint = () => {

    mintHunterMutation.mutateAsync()
    // This would normally connect to a blockchain operation
    // For UI only, we'll just update the counter
    // setTotalMinted((prev) => prev + mintCount)
    
    // In a real implementation, this would trigger a blockchain transaction
    console.log(`Minting ${mintCount} hunters for ${mintCount * mintFee} SOL`)
  }

  const decrementCount = () => {
    if (mintCount > 1) {
      setMintCount(mintCount - 1)
    }
  }

  const incrementCount = () => {
    if (mintCount < 5) {
      setMintCount(mintCount + 1)
    }
  }

  return (
    <>
      <style jsx global>{`
        .hunter-minting-page {
          position: relative;
          z-index: 0;
        }
        .hunter-minting-page::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          // background-image: url('/assets/forest-with-hunter.png');
          background-size: cover;
          background-position: center;
          z-index: -1;
        }
      `}</style>
      <div className="hunter-minting-page">
        <AppHero 
          title="Mint your Hunter" 
          subtitle="Join the game by minting your Hunter NFT" 
        />
      
      <div className="max-w-md mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-base-200 bg-opacity-60 shadow-xl rounded-lg p-6 backdrop-blur-sm">
          <div className="text-center mb-6">
            <p className="text-lg mb-2">Hunter total supply is {totalSupply}, mint fee is {mintFee} SOL</p>
            
            <div className="flex items-center justify-center space-x-2 my-4">
              <div className="stats shadow">
                <div className="stat">
                  <div className="stat-value text-3xl">{totalMinted}</div>
                  <div className="stat-desc">of {totalSupply}</div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center mb-6">
              <div className="join">
                <button 
                  className="btn join-item" 
                  onClick={decrementCount}
                  disabled={mintCount <= 1}
                >
                  -
                </button>
                <div className="bg-base-100 join-item px-6 flex items-center justify-center min-w-[80px]">
                  {mintCount}
                </div>
                <button 
                  className="btn join-item" 
                  onClick={incrementCount}
                  disabled={mintCount >= 5}
                >
                  +
                </button>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-lg">Total cost: {(mintCount * mintFee).toFixed(2)} SOL</p>
            </div>
            
            <button 
              className="btn btn-primary btn-lg w-full"
              onClick={ handleMint }
            >
              Mint
            </button>
          </div>
          
        </div>
      </div>
      </div>
    </>
  )
}
