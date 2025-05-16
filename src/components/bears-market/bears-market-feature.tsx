'use client'

import { useState } from 'react'
import {  LAMPORTS_PER_SOL } from '@solana/web3.js'
import { BN } from '@coral-xyz/anchor'
import { useWallet } from '@solana/wallet-adapter-react'
import { AppHero } from '../ui/ui-layout'
import Image from 'next/image'
import { useGameProgramTrade } from '../game/game-data-access'
import { useGetBalance } from '../account/account-data-access'
import { AccountBalance } from '../account/account-ui'

function BalanceSol({ balance }: { balance: number }) {
  return <span>{Math.round((balance / LAMPORTS_PER_SOL) * 100000) / 100000}</span>
}

export default function BearsMarketFeature() {
  const { publicKey } = useWallet()
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy')
  const [solBalance, setSolBalance] = useState(4.9280)
  const [bearBalance, setBearBalance] = useState(14866)
  const [amount, setAmount] = useState('')

  const { buyBear, sellBear, userBearBalance } = useGameProgramTrade()

  const solBalanceQuery = useGetBalance({ address: publicKey! })

  console.log("allUserBearBalance=", userBearBalance.data?.free.toString())
  
  const handleTabChange = (tab: 'buy' | 'sell') => {
    setActiveTab(tab)
    setAmount('') // Reset amount when switching tabs
  }
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers and decimal points
    const value = e.target.value.replace(/[^0-9.]/g, '')
    setAmount(value)
  }
  
  const handleBuy = async () => {
    // This would normally connect to a blockchain operation
    console.log(`Buying BEAR with ${amount} SOL`)
    
    await buyBear.mutateAsync({ solAmount: new BN(amount).mul(new BN(LAMPORTS_PER_SOL)), minBearReceived: new BN(0), stake: false })
    // For UI demo purposes only
    if (parseFloat(amount) > 0) {
      setSolBalance(prev => Math.max(0, prev - parseFloat(amount)))
      setBearBalance(prev => prev + Math.floor(parseFloat(amount) * 100)) // Example conversion rate
    }
    setAmount('')
  }
  
  const handleSell = async () => {
    // This would normally connect to a blockchain operation
    console.log(`Selling ${amount} BEAR`)
    await sellBear.mutateAsync({ bearAmount: new BN(amount), minSolReceived: new BN(0)})
    
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
          // background-image: url('/assets/bears.png');
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
              <p className="text-lg">Balance: <BalanceSol balance={ solBalanceQuery.data! }/> SOL</p>
            ) : (
              <p className="text-lg">Balance: {userBearBalance.data?.free.toString()} BEAR </p>
            )}
          </div>
          
          {/* Amount input */}
          <div className="flex items-center mb-6">
            <input
              type="text"
              value={amount}
              onChange={handleAmountChange}
              className="input input-bordered w-full"
            />
            <span className="ml-2 text-lg">{activeTab === 'buy' ? 'SOL' : 'BEAR'}</span>
          </div>
          
          {/* Action button */}
          <button 
            className="btn btn-primary btn-lg w-full"
            style={{ backgroundColor: activeTab === 'buy' ? '#4285F4' : 'red'}}
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
