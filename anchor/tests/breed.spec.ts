import * as fs from 'fs'
import * as os from 'os';
import * as anchor from '@coral-xyz/anchor'
import {Program} from '@coral-xyz/anchor'
import {Keypair, PublicKey, Transaction, LAMPORTS_PER_SOL} from '@solana/web3.js'
import { getAssociatedTokenAddressSync, getMint, getAccount } from "@solana/spl-token";

import {HuntingGame} from '../target/types/hunting_game'

import { initializeGame } from './helper'

describe('HuntingGame:breed', () => {
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

  it('breedBear', async () => {
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
    let now = new anchor.BN(Date.now() / 1000)
    expect(userBearBalanceData.breedTime.lt(now)).toBeTruthy()


    let yesterday = new anchor.BN(userBearBalanceData.breedTime.toNumber() - 24 * 60 * 60 - 10)
    await program.methods
      .setTimestampForTest(yesterday)
      .accounts({
        signer: adminKeypair.publicKey,
        gameState,
        userBearBalance
      })
      .signers([adminKeypair])
      .rpc()

    await program.methods
      .breedBear()
      .accounts({
        signer: adminKeypair.publicKey,
        gameState,
        userBearBalance
      })
      .signers([adminKeypair])
      .rpc()

    const userBearBalanceAfter = await program.account.userBearBalance.fetch(userBearBalance.toBase58())
    expect(userBearBalanceAfter.free.toNumber()).toEqual(2472096)
  })
})
