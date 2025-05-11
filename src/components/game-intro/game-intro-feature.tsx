'use client'

import { AppHero } from '../ui/ui-layout'
import Image from 'next/image'
import Link from 'next/link'

export default function GameIntroFeature() {
  return (
    <>
      <style jsx global>{`
        .game-intro-page {
          position: relative;
          z-index: 0;
        }
        .game-intro-page::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: url('/assets/forest.png');
          background-size: cover;
          background-position: center;
          z-index: -1;
        }
      `}</style>
      <div className="game-intro-page">
        <AppHero 
          title="Welcome to the Hunting Game" 
          subtitle="A thrilling blockchain adventure in the wilderness" 
        />
      
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-base-200 bg-opacity-60 shadow-xl rounded-lg p-6">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-center">Game Overview</h2>
              <p className="text-lg mb-4">
                Welcome to the Hunting Game, where players can mint hunter NFTs, buy and sell bears, and embark on thrilling hunts in a virtual forest.
                This blockchain-based game combines strategy, luck, and skill as you navigate the wilderness in search of your prey.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h3 className="card-title">1. Mint a Hunter</h3>
                  <p>Start your adventure by minting a unique Hunter NFT that will represent you in the game.</p>
                  <div className="card-actions justify-end mt-4">
                    <Link href="/hunter-minting" className="btn btn-primary">Mint Hunter</Link>
                  </div>
                </div>
              </div>
              
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h3 className="card-title">2. Buy/Sell Bears</h3>
                  <p>Visit the Bears Market to purchase or sell bears. This market will open when all Hunters are minted.</p>
                  <div className="card-actions justify-end mt-4">
                    <Link href="/bears-market" className="btn btn-primary">Bears Market</Link>
                  </div>
                </div>
              </div>
              
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h3 className="card-title">3. Go Hunting</h3>
                  <p>Enter the forest and hunt the bears if you are Hunter who hold 1 or more Hunters.</p>
                  <div className="card-actions justify-end mt-4">
                    <Link href="/hunt" className="btn btn-primary">Hunt Now</Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-center">How to Play</h2>
              <ol className="list-decimal list-inside space-y-3 text-lg">
                <li>Mint your Hunter NFT from the Hunter Minting page</li>
                <li>Visit the Bears Market to buy or sell bears</li>
                <li>Go to the Hunt page to start hunting the bears if you hold 1 or more Hunter NFTs</li>
              </ol>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-center">Game Mechanics</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold mb-2">Hunters and Bears:</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Hunters are NFTs with a maximum supply of 1,000.</li>
                    <li>Bears are regular tokens with an initial supply of 1,000,000,000.</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold mb-2">Minting Hunters:</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Users can mint a Hunter for 0.1 SOL each.</li>
                    <li>When all 1,000 Hunters are minted, the contract will have collected 100 SOL.</li>
                    <li>At this point, the 100 SOL and 1,000,000,000 Bears form a Liquidity Pool (LP).</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold mb-2">Hunter Attributes:</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Each Hunter has a "daily hunt amount" attribute randomly assigned at mint.</li>
                    <li>This attribute determines how many Bear tokens the Hunter can hunt per day.</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold mb-2">Hunting Bears:</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Hunter owners can hunt Bears once every 24 hours.</li>
                    <li>When a Hunter hunts Bears, they keep 20% of the Bears they hunt.</li>
                    <li>The remaining 80% of hunted Bears are burned.</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold mb-2">Trading Bears:</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>The LP implements a simple constant product AMM (Automated Market Maker).</li>
                    <li>Users can buy Bears with SOL or sell Bears for SOL.</li>
                    <li>As Bears are hunted and burned, the supply decreases, potentially causing the price to rise.</li>
                  </ul>
                </div>
              </div>
            </div>
          
          </div>
        </div>
      </div>
    </>
  )
}
