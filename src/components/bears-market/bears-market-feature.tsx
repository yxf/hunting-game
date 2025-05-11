'use client'

import { useState } from 'react'
import { AppHero } from '../ui/ui-layout'
import Image from 'next/image'

export default function BearsMarketFeature() {
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy')
  const [solBalance, setSolBalance] = useState(4.9280)
  const [bearBalance, setBearBalance] = useState(14866)
  const [amount, setAmount] = useState('')
  
  const handleTabChange = (tab: 'buy' | 'sell') => {
    setActiveTab(tab)
    setAmount('') // Reset amount when switching tabs
  }
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers and decimal points
    const value = e.target.value.replace(/[^0-9.]/g, '')
    setAmount(value)
  }
  
  const handleBuy = () => {
    // This would normally connect to a blockchain operation
    console.log(`Buying BEAR with ${amount} SOL`)
    // For UI demo purposes only
    if (parseFloat(amount) > 0) {
      setSolBalance(prev => Math.max(0, prev - parseFloat(amount)))
      setBearBalance(prev => prev + Math.floor(parseFloat(amount) * 100)) // Example conversion rate
    }
    setAmount('')
  }
  
  const handleSell = () => {
    // This would normally connect to a blockchain operation
    console.log(`Selling ${amount} BEAR`)
    // For UI demo purposes only
    if (parseFloat(amount) > 0 && parseFloat(amount) <= bearBalance) {
      setBearBalance(prev => Math.max(0, prev - parseFloat(amount)))
      setSolBalance(prev => prev + (parseFloat(amount) * 0.01)) // Example conversion rate
    }
    setAmount('')
  }

  return (
    <>
      <style jsx global>{`
        .bears-market-page {
          position: relative;
          z-index: 0;
        }
        .bears-market-page::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: url('/assets/bears.png');
          background-size: cover;
          background-position: center;
          z-index: -1;
        }
      `}</style>
    <div className="bears-market-page">
      <AppHero 
        title="Buy/Sell your Bears" 
        subtitle="in BEAR x SOL Pool" 
      />
      
      <div className="max-w-md mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="bg-base-200 bg-opacity-60 rounded-lg p-6 backdrop-blur-sm">
          {/* Tab buttons */}
          <div className="tabs tabs-boxed mb-6">
            <button 
              className={`tab grow ${activeTab === 'buy' ? 'bg-blue-100 text-black' : ''}`}
              onClick={() => handleTabChange('buy')}
            >
              Buy
            </button>
            <button 
              className={`tab grow ${activeTab === 'sell' ? 'bg-blue-100 text-black' : ''}`}
              onClick={() => handleTabChange('sell')}
            >
              Sell
            </button>
          </div>
          
          {/* Balance display */}
          <div className="mb-6">
            {activeTab === 'buy' ? (
              <p className="text-lg">Balance: {solBalance.toFixed(4)} SOL</p>
            ) : (
              <p className="text-lg">BEAR Balance: {bearBalance}</p>
            )}
          </div>
          
          {/* Amount input */}
          <div className="flex items-center mb-6">
            <input
              type="text"
              value={amount}
              onChange={handleAmountChange}
              placeholder={activeTab === 'buy' ? "1.2" : "200"}
              className="input input-bordered w-full"
            />
            <span className="ml-2 text-lg">{activeTab === 'buy' ? 'SOL' : 'BEAR'}</span>
          </div>
          
          {/* Action button */}
          <button 
            className="btn btn-primary btn-lg w-full text-white"
            style={{ backgroundColor: '#4285F4' }}
            onClick={activeTab === 'buy' ? handleBuy : handleSell}
          >
            {activeTab === 'buy' ? 'Buy' : 'Sell'}
          </button>
        </div>
      </div>
    </div>
    </>
  )
}
