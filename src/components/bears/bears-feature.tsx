'use client'

import { useState } from 'react'
import { BearBalance } from '../my/my-ui'
import { AppHero } from '../ui/ui-layout'

export default function BearsFeature() {

  return (
    <div className="container pb-8 w-[900px]">
      <AppHero 
        title="My Bears"
        subtitle="Breed bears to get more." 
      />
      <BearBalance />
    </div>
  )
}