import * as fs from 'fs'
import * as os from 'os';
import * as anchor from '@coral-xyz/anchor'
import {Program} from '@coral-xyz/anchor'
import {Keypair, PublicKey, Transaction, LAMPORTS_PER_SOL} from '@solana/web3.js'
import { getAssociatedTokenAddressSync, getMint, getAccount } from "@solana/spl-token";

import {HuntingGame} from '../target/types/hunting_game'

describe('HuntingGame:Initialize', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)
  const payer = provider.wallet as anchor.Wallet
  const program = anchor.workspace.HuntingGame as Program<HuntingGame>

  const seed = JSON.parse(fs.readFileSync(`${os.homedir()}/.config/solana/id.json`, 'utf-8'))
  const adminKeypair = Keypair.fromSecretKey(new Uint8Array(seed))

  it('Initialize', async () => {
    const [gameState] = PublicKey.findProgramAddressSync(
      [Buffer.from("game_state")],
      program.programId
    );

    const [gameVault] = PublicKey.findProgramAddressSync(
      [Buffer.from("game_vault")],
      program.programId
    );

    const [ hunterCollectionMint ] = PublicKey.findProgramAddressSync(
      [Buffer.from("hunter_collection_mint")],
      program.programId
    );

    const hunterCollectionMintTokenAccount =  getAssociatedTokenAddressSync(
      hunterCollectionMint,
      adminKeypair.publicKey
    );

    console.log("hunterCollectionMintTokenAccount=", hunterCollectionMintTokenAccount.toBase58());
    // const [ masterEditionAccount ] = await findMasterEditionPda(hunterCollectionMint, MPL_TOKEN_METADATA_PROGRAM_ID)
    // const [ metadataAccount ] = await findMetadataPda(hunterCollectionMint, MPL_TOKEN_METADATA_PROGRAM_ID)

    await program.methods
      .initialize()
      .accounts({
        admin: adminKeypair.publicKey,
        gameState,
        gameVault,
        hunterCollectionMint,
        hunterCollectionMintTokenAccount
      })
      .signers([adminKeypair])
      .rpc()
    
    const hunterCollectionInfo = await getMint(provider.connection, hunterCollectionMint);
    expect(Number(hunterCollectionInfo.supply)).toEqual(1)
    expect(hunterCollectionInfo.isInitialized).toBeTruthy()

    const tokenAccount = await getAccount(provider.connection, hunterCollectionMintTokenAccount)
    expect(tokenAccount.mint.toBase58()).toEqual(hunterCollectionMint.toBase58())
    expect(Number(tokenAccount.amount)).toEqual(1)

    const gameStateData = await program.account.gameState.fetch(gameState.toBase58())
    expect(gameStateData.gameInitialized).toBeTruthy()
    expect(gameStateData.hunterCollectionMint.toBase58()).toEqual(hunterCollectionMint.toBase58())
  })

  it('InitializeBearPoolForTest', async () => {
    const [gameState] = PublicKey.findProgramAddressSync(
      [Buffer.from("game_state")],
      program.programId
    );
    // const gameStateData = await program.account.gameState.fetch(gameState.toBase58())

    const [gameVault] = PublicKey.findProgramAddressSync(
      [Buffer.from("game_vault")],
      program.programId
    );

    console.log("gameVault=", gameVault.toBase58());

    await program.methods
        .initializeBearPoolForTest()
        .accounts({
            admin: adminKeypair.publicKey,
            gameState,
            gameVault,
        })
        .signers([adminKeypair])
        .rpc()

    const gameStateData = await program.account.gameState.fetch(gameState.toBase58())
    const solBalance = await provider.connection.getBalance(gameVault);
    expect(solBalance > 100 * LAMPORTS_PER_SOL).toBeTruthy()
    expect(gameStateData.lpInitialized).toBeTruthy()
    expect(gameStateData.lpBearBalance.toNumber()).toEqual(1000000000)
    expect(gameStateData.lpSolBalance.toNumber()).toEqual(100000000000) // 100 SOL
  })
})
