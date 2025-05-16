'use client'

import { getGameProgram, getGameProgramId, getGameAccounts, getHunterAccounts } from '@project/anchor'
import {TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID} from '@solana/spl-token'
import {useConnection, useWallet} from '@solana/wallet-adapter-react'
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  TransactionSignature,
  VersionedTransaction,
} from '@solana/web3.js'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {useTransactionToast} from '../ui/ui-layout'

// export function useGetBalance({ address }: { address: PublicKey }) {
//   const { connection } = useConnection()

//   return useQuery({
//     queryKey: ['get-balance', { endpoint: connection.rpcEndpoint, address }],
//     queryFn: () => connection.getBalance(address),
//   })
// }

// export function useGetSignatures({ address }: { address: PublicKey }) {
//   const { connection } = useConnection()

//   return useQuery({
//     queryKey: ['get-signatures', { endpoint: connection.rpcEndpoint, address }],
//     queryFn: () => connection.getSignaturesForAddress(address),
//   })
// }

export function useGetHunters({ address }: { address: PublicKey }) {
  const { connection } = useConnection()

  return useQuery({
    queryKey: ['get-hunters', { endpoint: connection.rpcEndpoint, address }],
    queryFn: async () => {
        const accounts = await connection.getParsedTokenAccountsByOwner(address, {
          programId: TOKEN_PROGRAM_ID,
        })
        console.log("accounts.value=", accounts.value)
        return accounts.value
    },
  })
}
