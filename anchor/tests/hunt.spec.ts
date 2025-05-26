import * as fs from 'fs'
import * as os from 'os';
import * as anchor from '@coral-xyz/anchor'
import {Program} from '@coral-xyz/anchor'
import {Keypair, PublicKey, Transaction, LAMPORTS_PER_SOL} from '@solana/web3.js'
import { getAssociatedTokenAddressSync, getMint, getAccount } from "@solana/spl-token";

import {HuntingGame} from '../target/types/hunting_game'
import { initializeGame, airdropSol } from './helper'
import { Key } from '@metaplex-foundation/mpl-token-metadata';

describe('HuntingGame:SellBear', () => {
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

  it('hunt', async () => {
    const user = Keypair.generate()
    await airdropSol(user.publicKey, 10);

    const hunterUser = Keypair.generate()
    await airdropSol(hunterUser.publicKey, 10);

    const [gameState] = PublicKey.findProgramAddressSync(
      [Buffer.from("game_state")],
      program.programId
    );

    const [gameVault] = PublicKey.findProgramAddressSync(
      [Buffer.from("game_vault")],
      program.programId
    );

    const [userBearBalance] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_bear_balance"), user.publicKey.toBuffer()],
      program.programId
    );
    // user buys some bears
    let solPaid = new anchor.BN(LAMPORTS_PER_SOL) // 1 SOL
    let minBearReceived = new anchor.BN(1)
    
    await program.methods
    .buyBear(solPaid, minBearReceived, false)
    .accounts({
        signer: user.publicKey,
        gameState,
        gameVault,
        userBearBalance
    })
    .signers([user])
    .rpc()


    //hunter mints a hunter
    const gameStateData = await program.account.gameState.fetch(gameState.toBase58())
    const hunterId = gameStateData.huntersMinted.add(new anchor.BN(1))
    const hunterIdBytes = hunterId.toArrayLike(Buffer, "le", 8)

    const [hunterMint] = PublicKey.findProgramAddressSync(
        [Buffer.from("hunter_mint"), hunterIdBytes],
        program.programId
    );

    const hunterMintTokenAccount = getAssociatedTokenAddressSync(
        hunterMint,
        hunterUser.publicKey
    );

    const [hunter] = PublicKey.findProgramAddressSync(
        [Buffer.from("hunter"), hunterMint.toBuffer()],
        program.programId
    );

    await program.methods
        .mintHunter()
        .accounts({
            signer: hunterUser.publicKey,
            gameState,
            gameVault,
            hunterMint,
            hunterMintTokenAccount,
            hunter
        })
        .signers([hunterUser])
        .rpc()

    
    const [hunterBearBalance] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_bear_balance"), hunterUser.publicKey.toBuffer()],
      program.programId
    );
    
    const userBearBalanceBefore = await program.account.userBearBalance.fetch(userBearBalance.toBase58())


    await program.methods
        .hunt(user.publicKey, hunterId)
        .accounts({
            signer: hunterUser.publicKey,
            gameState,
            hunterMint,
            hunterMintTokenAccount,
            hunter,
            userBearBalance,
            hunterBearBalance
        })
        .signers([hunterUser])
        .rpc()

    const hunterInfo = await program.account.hunter.fetch(hunter.toBase58())
    const huntedBearAmount = hunterInfo.huntRate.mul(new anchor.BN(100))
    
    const hunterReceivedBears = huntedBearAmount.mul(new anchor.BN(20)).div(new anchor.BN(100))

    const hunterBearBalanceData = await program.account.userBearBalance.fetch(hunterBearBalance.toBase58())
    expect(hunterBearBalanceData.free.toNumber()).toEqual(hunterReceivedBears.toNumber())

    const userBearBalanceAfter = await program.account.userBearBalance.fetch(userBearBalance.toBase58())
    expect(userBearBalanceBefore.free.sub(userBearBalanceAfter.free).toNumber()).toEqual(huntedBearAmount.toNumber())

  })
})
