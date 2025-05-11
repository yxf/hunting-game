'use client'

import { useState } from 'react'
import { AppHero } from '../ui/ui-layout'

export default function HunterMintingFeature() {
  const [mintCount, setMintCount] = useState(1)
  const [totalMinted, setTotalMinted] = useState(356)
  const totalSupply = 1000
  const mintFee = 0.1 // SOL

  const handleMint = () => {
    // This would normally connect to a blockchain operation
    // For UI only, we'll just update the counter
    setTotalMinted((prev) => prev + mintCount)
    
    // In a real implementation, this would trigger a blockchain transaction
    console.log(`Minting ${mintCount} hunters for ${mintCount * mintFee} SOL`)
  }

  const decrementCount = () => {
    if (mintCount > 1) {
      setMintCount(mintCount - 1)
    }
  }

  const incrementCount = () => {
    if (mintCount < 10) {
      setMintCount(mintCount + 1)
    }
  }

  return (
    <div>
      <AppHero 
        title="Mint your Hunter" 
        subtitle="Join the game by minting your Hunter NFT" 
      />
      
      <div className="max-w-md mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-base-200 shadow-xl rounded-lg p-6">
          <div className="text-center mb-6">
            <p className="text-lg mb-2">Hunter total supply is {totalSupply}, mint fee is {mintFee} SOL</p>
            
            <div className="flex items-center justify-center space-x-2 my-4">
              <div className="stats shadow">
                <div className="stat">
                  <div className="stat-value text-3xl">{totalMinted}</div>
                  <div className="stat-desc">of {totalSupply} left</div>
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
                  disabled={mintCount >= 10}
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
              onClick={handleMint}
            >
              Mint
            </button>
          </div>
          
        </div>
      </div>
    </div>
  )
}
