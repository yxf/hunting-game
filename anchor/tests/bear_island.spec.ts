import * as fs from 'fs'
import * as os from 'os';
import * as anchor from '@coral-xyz/anchor'
import {Program} from '@coral-xyz/anchor'
import {Keypair, PublicKey, Transaction, LAMPORTS_PER_SOL} from '@solana/web3.js'
import { getAssociatedTokenAddressSync, getMint, getAccount } from "@solana/spl-token";

import {HuntingGame} from '../target/types/hunting_game'

import { initializeGame } from './helper'

describe('HuntingGame:BearIsland', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)
  const payer = provider.wallet as anchor.Wallet
  const program = anchor.workspace.HuntingGame as Program<HuntingGame>

  const seed = JSON.parse(fs.readFileSync(`${os.homedir()}/.config/solana/id.json`, 'utf-8'))
  const adminKeypair = Keypair.fromSecretKey(new Uint8Array(seed))

  beforeEach(async () => {
    await initializeGame()
  })

  it('enter_island', async () => {
    const [gameState] = PublicKey.findProgramAddressSync(
      [Buffer.from("game_state")],
      program.programId
    );

    const [gameVault] = PublicKey.findProgramAddressSync(
      [Buffer.from("game_vault")],
      program.programId
    );

    const [userBearBalance] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_bear_balance"), adminKeypair.publicKey.toBuffer()],
      program.programId
    );

    let solPaid = new anchor.BN(LAMPORTS_PER_SOL)
    let minBearReceived = new anchor.BN(1)

    await program.methods
      .buyBear(solPaid, minBearReceived, false)
      .accounts({
        signer: adminKeypair.publicKey,
        gameState,
        gameVault,
        userBearBalance
      })
      .signers([adminKeypair])
      .rpc()
    
    const userBearBalanceData = await program.account.userBearBalance.fetch(userBearBalance.toBase58())
    expect(userBearBalanceData.free.toNumber()).toEqual(2459798)


    await program.methods
      .enterIsland()
      .accounts({
        signer: adminKeypair.publicKey,
        gameState,
        userBearBalance
      })
      .signers([adminKeypair])
      .rpc()
    
    const userBearBalanceAfter = await program.account.userBearBalance.fetch(userBearBalance.toBase58())
    console.log(userBearBalanceAfter)
    expect(userBearBalanceAfter.free.toNumber()).toEqual(0)
    expect(userBearBalanceAfter.staked.toNumber()).toEqual(2459798)
    expect(userBearBalanceAfter.stakedTime.toNumber() > 0).toBeTruthy()
  })

  it('request_exit_island', async () => {
    // const [gameState] = PublicKey.findProgramAddressSync(
    //   [Buffer.from("game_state")],
    //   program.programId
    // );

    // const [gameVault] = PublicKey.findProgramAddressSync(
    //   [Buffer.from("game_vault")],
    //   program.programId
    // );

    const [userBearBalance] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_bear_balance"), adminKeypair.publicKey.toBuffer()],
      program.programId
    );

    // let solPaid = new anchor.BN(LAMPORTS_PER_SOL)
    // let minBearReceived = new anchor.BN(1)

    // await program.methods
    //   .buyBear(solPaid, minBearReceived, false)
    //   .accounts({
    //     signer: adminKeypair.publicKey,
    //     gameState,
    //     gameVault,
    //     userBearBalance
    //   })
    //   .signers([adminKeypair])
    //   .rpc()
    
    // const userBearBalanceData = await program.account.userBearBalance.fetch(userBearBalance.toBase58())
    // expect(userBearBalanceData.free.toNumber()).toEqual(2459798)


    await program.methods
      .requestExitIsland()
      .accounts({
        signer: adminKeypair.publicKey,
        userBearBalance
      })
      .signers([adminKeypair])
      .rpc()
    
    const userBearBalanceAfter = await program.account.userBearBalance.fetch(userBearBalance.toBase58())
    expect(userBearBalanceAfter.requestUnstakeTime.toNumber() > 0).toBeTruthy()
  })

  it('exit_island', async () => {
    const [gameState] = PublicKey.findProgramAddressSync(
      [Buffer.from("game_state")],
      program.programId
    );

    const [gameVault] = PublicKey.findProgramAddressSync(
      [Buffer.from("game_vault")],
      program.programId
    );

    const [userBearBalance] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_bear_balance"), adminKeypair.publicKey.toBuffer()],
      program.programId
    );

    // let solPaid = new anchor.BN(LAMPORTS_PER_SOL)
    // let minBearReceived = new anchor.BN(1)

    // await program.methods
    //   .buyBear(solPaid, minBearReceived, false)
    //   .accounts({
    //     signer: adminKeypair.publicKey,
    //     gameState,
    //     gameVault,
    //     userBearBalance
    //   })
    //   .signers([adminKeypair])
    //   .rpc()
    
    const userBearBalanceData = await program.account.userBearBalance.fetch(userBearBalance.toBase58())
    // expect(userBearBalanceData.free.toNumber()).toEqual(2459798)

    let _3DaysAgo = new anchor.BN(userBearBalanceData.requestUnstakeTime.toNumber() - 3 * 24 * 60 * 60 - 10)
    
    await program.methods
      .setRequestExitIslandTimestamp(_3DaysAgo)
      .accounts({
        signer: adminKeypair.publicKey,
        userBearBalance
      })
      .signers([adminKeypair])
      .rpc()

    const solBalanceBefore = await provider.connection.getBalance(gameVault);
    const gameStateBefore = await program.account.gameState.fetch(gameState.toBase58())

    await program.methods
      .exitIsland()
      .accounts({
        signer: adminKeypair.publicKey,
        gameState,
        userBearBalance
      })
      .signers([adminKeypair])
      .rpc()
    const solBalanceAfter = await provider.connection.getBalance(gameVault);
    expect(solBalanceAfter-solBalanceBefore).toEqual(LAMPORTS_PER_SOL * 0.1)

    const userBearBalanceAfter = await program.account.userBearBalance.fetch(userBearBalance.toBase58())
    console.log(userBearBalanceAfter)
    // expect(userBearBalanceAfter.free.toNumber()).toEqual(0)
    expect(userBearBalanceAfter.staked.toNumber()).toEqual(0)
    expect(userBearBalanceAfter.requestUnstakeTime.toNumber()).toEqual(0)

    const gameStateAfter = await program.account.gameState.fetch(gameState.toBase58())
    expect(gameStateAfter.lpSolBalance.sub(gameStateBefore.lpSolBalance).toNumber()).toEqual(LAMPORTS_PER_SOL * 0.1)

  })
})
