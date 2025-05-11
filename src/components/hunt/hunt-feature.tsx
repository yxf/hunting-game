'use client'

import { useState } from 'react'
import { AppHero } from '../ui/ui-layout'
import Image from 'next/image'

type HunterNFT = {
  id: string;
  name: string;
}

type BearsHolder = {
  id: string;
  name: string;
  bearsCount: number;
}

type HuntResult = {
  totalHunted: number;
  walletBears: number;
  burnedBears: number;
}

export default function HuntFeature() {
  // Mock data for hunters and holders
  const hunterNFTs: HunterNFT[] = [
    { id: '1', name: 'Hunter1' },
    { id: '2', name: 'Hunter2' },
  ]
  
  const bearsHolders: BearsHolder[] = [
    { id: '1', name: 'Holder1', bearsCount: 1245 },
    { id: '2', name: 'Holder2', bearsCount: 12578 },
  ]
  
  const [selectedHunter, setSelectedHunter] = useState<HunterNFT | null>(hunterNFTs[0])
  const [selectedHolder, setSelectedHolder] = useState<BearsHolder | null>(null)
  const [huntResult, setHuntResult] = useState<HuntResult | null>(null)
  const [showHunterDropdown, setShowHunterDropdown] = useState(false)
  const [showHolderDropdown, setShowHolderDropdown] = useState(false)
  const [hunterCount, setHunterCount] = useState(2) // Number of hunter NFTs owned
  const [huntingTimes, setHuntingTimes] = useState(1) // Number of hunting times left today
  
  const selectHunter = (hunter: HunterNFT) => {
    setSelectedHunter(hunter)
    setSelectedHolder(null) // Reset holder selection when hunter changes
    setHuntResult(null) // Reset hunt result
    setShowHunterDropdown(false)
  }
  
  const selectHolder = (holder: BearsHolder) => {
    setSelectedHolder(holder)
    setHuntResult(null) // Reset hunt result
    setShowHolderDropdown(false)
  }
  
  const performHunt = () => {
    if (!selectedHunter || !selectedHolder) return
    
    // Mock hunt result - in a real app this would be a blockchain transaction
    const totalHunted = 100
    const walletBears = 20
    const burnedBears = 80
    
    setHuntResult({
      totalHunted,
      walletBears,
      burnedBears
    })
    
    // Decrease hunting times left
    setHunterCount(prev => Math.max(0, prev - 1))
  }
  
  const resetHunt = () => {
    setHuntResult(null)
  }
  
  return (
    <>
      <style jsx global>{`
        .hunting-page {
          position: relative;
          z-index: 0;
        }
        .hunting-page::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: url('/assets/hunting.png');
          background-size: cover;
          background-position: center;
          z-index: -1;
        }
      `}</style>
    <div className="hunting-page">
      <AppHero 
        title={`You are Hunter ${hunterCount > 0 ? `× ${hunterCount}` : ''}`}
        subtitle={`Hunt some bears. Today you have ${huntingTimes} time left today.`} 
      />
      
      <div className="max-w-md mx-auto py-4 px-4 sm:px-6 lg:px-8">
        
        {!huntResult ? (
          <div className="space-y-4">
            {/* Hunter Selection */}
            <div className="relative">
              <button 
                className="btn bg-gray-500 text-white w-40 flex justify-between items-center"
                onClick={() => setShowHunterDropdown(!showHunterDropdown)}
              >
                {selectedHunter ? selectedHunter.name : 'Select your Hunter'} 
                <span className="ml-2">▼</span>
              </button>
              
              {showHunterDropdown && (
                <div className="absolute mt-1 w-full bg-white border rounded-md shadow-lg z-10">
                  {hunterNFTs.map(hunter => (
                    <div 
                      key={hunter.id}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => selectHunter(hunter)}
                    >
                      {hunter.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Bears Holder Selection - Only show if Hunter is selected */}
            {selectedHunter && (
              <div className="relative">
                <button 
                  className="btn bg-gray-500 text-white w-64 flex justify-between items-center"
                  onClick={() => setShowHolderDropdown(!showHolderDropdown)}
                >
                  {selectedHolder 
                    ? `${selectedHolder.name}` 
                    : 'Select a Bears holder'} 
                  <span className="ml-2">▼</span>
                </button>
                
                {showHolderDropdown && (
                  <div className="absolute mt-1 w-full bg-white border rounded-md shadow-lg z-10">
                    {bearsHolders.map(holder => (
                      <div 
                        key={holder.id}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => selectHolder(holder)}
                      >
                        {holder.name} with {holder.bearsCount} Bears
                      </div>
                    ))}
                    <div className="px-4 py-2 text-gray-500">...</div>
                  </div>
                )}
              </div>
            )}
            
            {/* Hunt Button - Only show if both Hunter and Holder are selected */}
            {selectedHunter && selectedHolder && (
              <button 
                className="btn bg-blue-500 hover:bg-blue-600 text-white w-24"
                onClick={performHunt}
              >
                Hunt
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-lg font-bold">You hunted {huntResult.totalHunted} bears.</p>
            <p className="text-sm">{huntResult.walletBears} bears has gone into your wallet. {huntResult.burnedBears} bears has been burned.</p>
            
            <button 
              className="btn btn-link text-blue-500 px-0"
              onClick={resetHunt}
            >
              Hunt again
            </button>
          </div>
        )}
      </div>
    </div>
    </>
  )
}
