'use client'

import { getGameProgram, getGameProgramId, getGameAccounts, getHunterAccounts, getUserBalanceAccount } from '@project/anchor'
import { BN } from '@coral-xyz/anchor'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import {
  Cluster,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionMessage,
  TransactionSignature,
  VersionedTransaction,
} from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../ui/ui-layout'
import { get } from 'http'
import { AnchorProvider } from '@coral-xyz/anchor'

export function useGameProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getGameProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getGameProgram(provider, programId), [provider, programId])
  const accounts = useMemo(() => getGameAccounts(provider.wallet.publicKey), [provider])

  const userBearBalanceAccount = useMemo(() => provider.wallet.publicKey ? getUserBalanceAccount(provider.wallet.publicKey) : null, [provider])


  const gameState = useQuery({
    queryKey: ['game', 'all', { cluster }],
    queryFn: () => program.account.gameState.all(),
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-game-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  const userBearBalance = useQuery({
    queryKey: ['user-bear-balance', { cluster }],
    queryFn: () => program.account.userBearBalance.fetch(userBearBalanceAccount!), 
  })

  const allUserBearBalances = useQuery({
    queryKey: ['all-user-bear-balance', { cluster }],
    queryFn: () => program.account.userBearBalance.all(), 
  })

  const getAllHunters = useQuery({
    queryKey: ['get-all-hunter-mints', { cluster }],
    queryFn: async () => {
      const gameStateAccount = await program.account.gameState.fetch(accounts.gameState)
      const hunters = []
      console.log("huntersMinted = ", gameStateAccount.huntersMinted.toNumber())
      for (let i = 0; i < gameStateAccount.huntersMinted.toNumber(); i++) {
        const hunterAccounts = getHunterAccounts(provider.wallet.publicKey, i + 1)
        const mintInfo = await connection.getParsedAccountInfo(hunterAccounts.hunterMintTokenAccount)
        // await program.account.associatedTokenAccount.fetch(hunterAccounts.hunterMintTokenAccount)
        if (mintInfo.value) {
          const hunterInfo = await program.account.hunter.fetch(hunterAccounts.hunter)
          // console.log("hunterInfo=", hunterInfo, mintInfo.value.data.parsed.info.mint)

          hunters.push({ ...hunterInfo, mint: mintInfo.value.data.parsed.info.mint })
        }
      }
      return hunters
    },
  })

  const initializeGame = useMutation({
    mutationKey: ['game', 'initialize', { cluster }],
    mutationFn: (adminPublicKey: PublicKey) =>
      program.methods.initialize().accounts({ 
        admin: adminPublicKey,
        gameState: accounts.gameState,
        gameVault: accounts.gameVault,
        bearMint: accounts.bearMint,
        hunterCollectionMint: accounts.hunterCollectionMint,
        associatedTokenAccount: accounts.associatedTokenAccount,
      }).rpc(),
    onSuccess: (signature) => {
      transactionToast(signature)
      return gameState.refetch()
    },
    onError: () => toast.error('Initialize game failed'),
  })

  const initializeLpForTest = useMutation({
    mutationKey: ['game', 'initialize-lp-for-test', { cluster }],
    mutationFn: (adminPublicKey: PublicKey) =>
      program.methods.initializeLpForTest().accounts({ 
        admin: adminPublicKey,
        gameState: accounts.gameState,
        gameVault: accounts.gameVault
      }).rpc(),
    onSuccess: (signature) => {
      transactionToast(signature)
      return gameState.refetch()
    },
    onError: () => toast.error('Initialize lp for test failed'),
  })

  const initializeLp= useMutation({
    mutationKey: ['game', 'initialize-lp', { cluster }],
    mutationFn: (adminPublicKey: PublicKey) =>
      program.methods.initializeLp().accounts({ 
        admin: adminPublicKey,
        gameState: accounts.gameState,
      }).rpc(),
    onSuccess: (signature) => {
      transactionToast(signature)
      return gameState.refetch()
    },
    onError: () => toast.error('Initialize lp failed'),
  })

  return {
    program,
    programId,
    gameState,
    getProgramAccount,
    initializeGame,
    initializeLpForTest,
    getAllHunters,
    userBearBalance,
    allUserBearBalances
  }
}

export function useGameProgramMintHunter({ count }: { count: number }) {
  const wallet = useWallet()
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getGameProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getGameProgram(provider, programId), [provider, programId])
  const accounts = useMemo(() => getGameAccounts(provider.wallet.publicKey), [provider])


  const gameState = useQuery({
    queryKey: ['game', 'all', { cluster }],
    queryFn: () => program.account.gameState.all(),
  })

  const mintHunterMutation = useMutation({
    mutationKey: ['game', 'mint-hunter', { cluster, count }],
    mutationFn: async () => {
      if (!wallet.publicKey) throw new Error("Wallet not connected");
      
      const { transaction} = await createMintHuntersTransaction({
        account: wallet.publicKey, 
        count, 
        cluster: cluster.network as Cluster, 
        provider
      })
    
      const latestBlockhash = await connection.getLatestBlockhash();
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer = wallet.publicKey;

      // Send transaction and await for signature
      const signature = await wallet.sendTransaction(transaction, connection)

      // Send transaction and await for signature
      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
      }, 'confirmed')

      return signature
    },
    onSuccess: (tx) => {
      transactionToast(tx)
      return gameState.refetch()
    },
    onError: (error) => {
      console.log("error", error)
      toast.error('Mint hunter failed')
    }
  })

  return {
    mintHunterMutation,
    gameState
  }
}


export function useGameProgramTrade() {
  const wallet = useWallet()
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getGameProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getGameProgram(provider, programId), [provider, programId])
  const accounts = useMemo(() => getGameAccounts(provider.wallet.publicKey), [provider])
  const userBearBalanceAccount = useMemo(() => provider.wallet.publicKey ? getUserBalanceAccount(provider.wallet.publicKey) : null, [provider])


  const gameState = useQuery({
    queryKey: ['game', 'all', { cluster }],
    queryFn: () => program.account.gameState.all(),
  })

  // const allUserBearBalances = useQuery({
  //   queryKey: ['game', 'user-balances', { cluster }],
  //   queryFn: () => program.account.userBearBalance.all(),
  // })

  const userBearBalance = useQuery({
    queryKey: ['user-bear-balance', { cluster }],
    queryFn: () => program.account.userBearBalance.fetch(userBearBalanceAccount!), 
  })

  const buyBear = useMutation({
    mutationKey: ['game', 'buy-bear', { cluster }],
    mutationFn: ({ solAmount, minBearReceived, stake }: { solAmount: BN; minBearReceived: BN; stake: boolean }) =>
      program.methods.buyBear(solAmount, minBearReceived, stake).accounts({ 
        signer: wallet.publicKey!,
        gameState: accounts.gameState,
        gameVault: accounts.gameVault,
        userBearBalance: userBearBalanceAccount,
      }).rpc(),
    onSuccess: (signature) => {
      transactionToast(signature)
      return userBearBalance.refetch()
    },
    onError: () => toast.error('Buy bear failed'),
  })

  const sellBear = useMutation({
    mutationKey: ['game', 'sell-bear', { cluster }],
    mutationFn: ({bearAmount, minSolReceived}: {bearAmount: BN, minSolReceived: BN}) =>
      program.methods.sellBear(bearAmount, minSolReceived).accounts({ 
        signer: wallet.publicKey!,
        gameState: accounts.gameState,
        gameVault: accounts.gameVault,
        sellUserBalance: userBearBalanceAccount,
      }).rpc(),
    onSuccess: (signature) => {
      transactionToast(signature)
      return userBearBalance.refetch()
    },
    onError: () => toast.error('Sell bear failed'),
  })

  return {
    buyBear,
    sellBear,
    gameState,
    userBearBalance
  }
}


async function createMintHuntersTransaction({
  account,
  count,
  cluster,
  provider
}: {
  account: PublicKey
  count: number,
  cluster: Cluster,
  provider: AnchorProvider
}): Promise<{
  transaction: Transaction
}> {
  const programId = getGameProgramId(cluster);
  const program = getGameProgram(provider, programId)
  const accounts = getGameAccounts(provider.wallet.publicKey)
  const gameStateAccount = await program.account.gameState.fetch(accounts.gameState)

  const transaction = new Transaction()
  for(let i = 1; i <= count; i++) {
    const hunterAccounts = getHunterAccounts(account, gameStateAccount.huntersMinted.toNumber() + i)
    const instruction = await program.methods.mintHunter()
    .accounts({ 
      signer: account,
      gameState: accounts.gameState,
      gameVault: accounts.gameVault,
      hunterMint: hunterAccounts.hunterMint,
      associatedTokenAccount: hunterAccounts.hunterMintTokenAccount,
      hunter: hunterAccounts.hunter,
    }).instruction()

    transaction.add(instruction)
  }

  return {
    transaction,
  }
}