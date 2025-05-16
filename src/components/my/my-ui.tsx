'use client'

import { useState, useEffect, useMemo } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useConnection } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useCluster } from '../cluster/cluster-data-access'
import { getGameProgramId, getGameAccounts, getHunterAccounts } from '@project/anchor'
import Image from 'next/image'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useGameProgram } from '../game/game-data-access'
import { useGetHunters } from './my-data-access'
import { ellipsify } from '../ui/ui-layout'


interface HunterNFT {
  mint: PublicKey
  name: string
  image: string,
  attributes?: {
    trait_type: string
    value: string
  }[]
}


export function HunterList() {
  const { publicKey } = useWallet()
  const { cluster } = useCluster()
  const { gameState, getProgramAccount, getAllHunters, userBearBalance } = useGameProgram()

  const allHunters = useMemo(() => {
    if (getAllHunters.data) {

      const hunters = getAllHunters.data.map((hunter) => {
        return {
          mint: hunter.mint,
          name: `Hunter #${hunter.tokenId.toString()}`,
          image: "/assets/hunter.png",
          attributes: [
            {
              trait_type: "Power",
              value: hunter.huntRate.toString()
            },
            // {
            //   trait_type: "Last hunt time",
            //   value: hunter.lastHuntTime.toString()
            // },
            // {
            //   trait_type: "Hunted Count",
            //   value: hunter.huntedCount.toString()
            // },
          ]
        } as HunterNFT
      })
      return hunters
    } else {
      return []
    }
  }, [ getAllHunters.data ])


  // console.log("accounts=", accounts.data)

  if (getProgramAccount.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>
  }

  if (!getProgramAccount.data?.value) {
    return (
      <div className="alert alert-info flex justify-center">
        <span>Program account not found. Make sure you have deployed the program and are on the correct cluster.</span>
      </div>
    )
  }
  return (
    <div className={'space-y-6'}>
      {getAllHunters.isLoading ? (
        <span className="loading loading-spinner loading-lg"></span>
      ) : getAllHunters.data?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {allHunters.map((hunter) => (
            <HunterCard key={hunter.name} hunter={hunter} cluster={cluster?.network} />
          ))}
        </div>
      ) : (
        <div className="text-center">
          <h2 className={'text-2xl'}>No hunters</h2>
          No hunters found. Mint one to get started.
        </div>
      )}
    </div>
  )
}

function HunterCard({ hunter, cluster }: { hunter: HunterNFT, cluster: string }) {
  const [isHuntModalOpen, setIsHuntModalOpen] = useState(false)
  return (
    <div>
      <div className="card bg-base-100 shadow-xl overflow-hidden">
        <figure className="px-4 pt-4">
          <div className="relative w-full h-48 rounded-lg overflow-hidden">
            <Image 
              src={hunter.image} 
              alt={hunter.name}
              fill
              style={{ objectFit: "cover" }}
              className="transition-transform hover:scale-110"
            />
          </div>
        </figure>
        
        <div className="card-body">
          <h2 className="card-title">{hunter.name}</h2>
          
          {hunter.attributes && hunter.attributes.length > 0 && (
            <div className="mt-2">
              {/* <h3 className="text-sm font-semibold mb-2">Attributes:</h3> */}
              <div className="grid">
                {hunter.attributes.map((attr, index) => (
                  <div key={index} className="badge badge-outline p-2 m-1">
                    <span className="font-medium mr-1">{attr.trait_type}:</span> {attr.value}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="card-actions justify-between mt-4">
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => setIsHuntModalOpen(true)}
            >
              Start to hunt
            </button>
            {/* <a 
              href={`https://explorer.solana.com/address/${hunter.mint.toString()}?cluster=${cluster}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-outline btn-sm"
            >
              View
            </a> */}
          </div>
        </div>
        <HuntingModal 
          isOpen={isHuntModalOpen} 
          onClose={() => setIsHuntModalOpen(false)} 
          hunter={hunter} 
        />
      </div>
    </div>
  )
}

function HuntingModal({ 
  isOpen, 
  onClose, 
  hunter 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  hunter: HunterNFT 
}) {
  const { allUserBearBalances } = useGameProgram()
  const [selectedBearAmount, setSelectedBearAmount] = useState(1)

  const handleHunt = () => {

    onClose()
  }

  return (
    <dialog className={`modal ${isOpen ? 'modal-open' : ''}`}>
      <div className="modal-box">
        <h3 className="font-bold text-lg">Start to hunt</h3>
        <div className="py-4">
          <div className="flex items-center mb-4">
            <div className="avatar mr-4">
              <div className="w-16 rounded">
                <img src={hunter.image} alt={hunter.name} />
              </div>
            </div>
            <div>
              <h4 className="font-bold">{hunter.name}</h4>
              {hunter.attributes?.map((attr, index) => (
                <p key={index} className="text-sm">
                  {attr.trait_type}: {attr.value}
                </p>
              ))}
            </div>
          </div>
          
          <div className="divider">Choose a Bear</div>
          <div className="overflow-x-auto">
            {allUserBearBalances.isLoading ? (
              <div className="flex justify-center">
                <span className="loading loading-spinner loading-sm"></span>
              </div>
            ) : allUserBearBalances.data?.length ? (
              <table className="table table-xs">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Free Bears</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {allUserBearBalances.data.map((balance, index) => (
                    <tr key={index}>
                      <td>{ellipsify(balance.account.user.toBase58())}</td>
                      <td>{balance.account.free.toString()}</td>
                      <td>
                        <button 
                          className='btn btn-primary btn-xs'
                        >
                          Hunt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-center text-sm">No bear balances found</p>
            )}
          </div>
          
        </div>
        
        <div className="modal-action">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button 
            className="btn btn-primary" 
            onClick={handleHunt}
          >
            Hunt Randomly
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>Close</button>
      </form>
    </dialog>
  )
}

export function BearBalance() {
  const { cluster } = useCluster()
  const { userBearBalance } = useGameProgram()

  return (
    userBearBalance.isLoading ? (
      <span className="loading loading-spinner loading-lg"></span>
    ) : userBearBalance.data ? (
      <div className="card bg-base-100 shadow-xl overflow-hidden">
        <figure className="px-4 pt-4">
          <div className="relative w-full h-48 rounded-lg overflow-hidden">
            <Image 
              src="/assets/bear2.png"
              alt="Bear"
              fill
              style={{ objectFit: "cover" }}
              className="transition-transform hover:scale-110"
            />
          </div>
        </figure>
        <div className="card-body">
          <h2 className="card-title">Bear</h2>
          <div className="mt-2">
              <div className="grid">
                <div className="badge badge-outline p-2 m-1">
                    <span className="font-medium mr-1">Value:</span>
                    { userBearBalance.data.free.toString() }
                  </div>
              </div>
            </div>
          <div className="card-actions justify-between mt-4">
            <button className="btn btn-primary btn-sm">Breed</button>
            {/* <a 
              href={`https://explorer.solana.com/address/1?cluster=${cluster}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-outline btn-sm"
            >
              View
            </a> */}
          </div>
        </div>
      </div>
    )  : null
  )
}