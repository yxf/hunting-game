'use client'

import { useState } from 'react'
import { HunterList, BearBalance } from './my-ui'

export default function MyFeature() {
  const [activeTab, setActiveTab] = useState<'hunters' | 'bears'>('hunters')

  return (
    <div className="container py-8 max-w-4xl">
      <div className="tabs tabs-boxed">
        <a 
          className={`tab tab-lg ${activeTab === 'hunters' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('hunters')}
        >
          Hunters
        </a>
        <a 
          className={`tab tab-lg ${activeTab === 'bears' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('bears')}
        >
          Bears
        </a>
      </div>

      <div className="">
        {activeTab === 'hunters' && (
          <div className="animate-fadeIn">
            <HunterList />
          </div>
        )}
        
        {activeTab === 'bears' && (
          <div className="animate-fadeIn">
            <BearBalance />
          </div>
        )}
      </div>
    </div>
  )
}