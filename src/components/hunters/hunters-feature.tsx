'use client'

import { useState } from 'react'
import { HunterList } from '../my/my-ui'
import { AppHero } from '../ui/ui-layout'

export default function HuntersFeature() {

  return (
    <div className="container pb-8 w-full w-[900px]">
        <AppHero 
            title="My Hunters"
            subtitle="" 
        />
      <HunterList />
    </div>
  )
}