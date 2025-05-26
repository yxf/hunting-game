import * as fs from 'fs'
import * as os from 'os';
import * as anchor from '@coral-xyz/anchor'
import {Program} from '@coral-xyz/anchor'
import {Keypair, PublicKey, Transaction, LAMPORTS_PER_SOL} from '@solana/web3.js'
import { getAssociatedTokenAddressSync, getMint, getAccount } from "@solana/spl-token";

import {HuntingGame} from '../target/types/hunting_game'

import { initializeGame } from './helper'

describe('HuntingGame:BuyBear', () => {
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

  it('buyBear', async () => {
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
    const gameStateBefore= await program.account.gameState.fetch(gameState.toBase58())

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
    const gameStateAfter= await program.account.gameState.fetch(gameState.toBase58())

    const valutAccountInfo =  await provider.connection.getAccountInfo(gameVault);
    console.log("vault account info", valutAccountInfo)
    expect(gameStateAfter.lpSolBalance.sub(gameStateBefore.lpSolBalance)).toEqual(solPaid)
    expect(gameStateBefore.lpBearBalance.sub(gameStateAfter.lpBearBalance).toNumber()).toEqual(2459798)
  })
})
