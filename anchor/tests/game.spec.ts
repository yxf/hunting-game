import * as fs from 'fs'
import * as os from 'os';

import * as anchor from '@coral-xyz/anchor'
import {Program} from '@coral-xyz/anchor'
import {Keypair} from '@solana/web3.js'
import { getAssociatedTokenAddress } from "@solana/spl-token";

import {
	findMasterEditionPda,
	findMetadataPda,
	mplTokenMetadata,
	MPL_TOKEN_METADATA_PROGRAM_ID,
} from "@metaplex-foundation/mpl-token-metadata";

import {HuntingGame} from '../target/types/hunting_game'

describe('counter', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)
  const payer = provider.wallet as anchor.Wallet
  const homeDir = os.homedir();
  const program = anchor.workspace.HuntingGame as Program<HuntingGame>

  const seed = JSON.parse(fs.readFileSync(`${homeDir}/.config/solana/id.json`, 'utf-8'))
  const adminKeypair = Keypair.fromSecretKey(new Uint8Array(seed))


  it('Initialize game state', async () => {
    const [gameState] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("game_state")],
      program.programId
    );

    const [bearMint] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("game_state")],
      program.programId
    );

    const [ hunterCollectionMint ] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("hunter_collection_mint")],
      program.programId
    );

    const associatedTokenAccount = await getAssociatedTokenAddress(
      hunterCollectionMint,
      adminKeypair.publicKey
    );
    const [ masterEdition ] = await findMasterEditionPda(hunterCollectionMint, MPL_TOKEN_METADATA_PROGRAM_ID)
    const [ metadataAccount ] = await findMetadataPda(hunterCollectionMint, MPL_TOKEN_METADATA_PROGRAM_ID)
    
    await program.methods
      .initialize("Hunter-uri")
      .accounts({
        admin: adminKeypair.publicKey,
        gameState,
        bearMint,
        hunterCollectionMint,
        associatedTokenAccount,
        metadataAccount,
        masterEdition
      })
      .signers([adminKeypair])
      .rpc()

    const gameStateData = await program.account.gameState.fetch(gameState.toBase58())
    console.log("gameStateData=", gameStateData);
    // expect(currentCount.count).toEqual(0)
  })

  // it('Increment Counter', async () => {
  //   await program.methods.increment().accounts({ counter: counterKeypair.publicKey }).rpc()

  //   const currentCount = await program.account.counter.fetch(counterKeypair.publicKey)

  //   expect(currentCount.count).toEqual(1)
  // })

  // it('Increment Counter Again', async () => {
  //   await program.methods.increment().accounts({ counter: counterKeypair.publicKey }).rpc()

  //   const currentCount = await program.account.counter.fetch(counterKeypair.publicKey)

  //   expect(currentCount.count).toEqual(2)
  // })

  // it('Decrement Counter', async () => {
  //   await program.methods.decrement().accounts({ counter: counterKeypair.publicKey }).rpc()

  //   const currentCount = await program.account.counter.fetch(counterKeypair.publicKey)

  //   expect(currentCount.count).toEqual(1)
  // })

  // it('Set counter value', async () => {
  //   await program.methods.set(42).accounts({ counter: counterKeypair.publicKey }).rpc()

  //   const currentCount = await program.account.counter.fetch(counterKeypair.publicKey)

  //   expect(currentCount.count).toEqual(42)
  // })

  // it('Set close the counter account', async () => {
  //   await program.methods
  //     .close()
  //     .accounts({
  //       payer: payer.publicKey,
  //       counter: counterKeypair.publicKey,
  //     })
  //     .rpc()

  //   // The account should no longer exist, returning null.
  //   const userAccount = await program.account.counter.fetchNullable(counterKeypair.publicKey)
  //   expect(userAccount).toBeNull()
  // })

  // it('Set user balance', async () => {
  //   const [userBalancePda, _] = await anchor.web3.PublicKey.findProgramAddressSync(
  //     [Buffer.from("user_balance"), payer.publicKey.toBuffer()],
  //     program.programId
  //   );

  //   const payerInfo = await provider.connection.getAccountInfo(payer.publicKey)

  //   const balance = new anchor.BN(2 * anchor.web3.LAMPORTS_PER_SOL)
  //   await program.methods
  //     .setUserBalance(balance)
  //     .accounts({ 
  //       user: payer.publicKey,
  //       userBalance: userBalancePda, 
  //     })
  //     .rpc()
  //   // Fetch the sol balance of user balance account
  //   const userBalanceAccount = await provider.connection.getAccountInfo(userBalancePda)
  //   console.log("userBalanceAccount=", userBalanceAccount);
   
  //   const userBalance = await program.account.userBalance.fetch(userBalancePda)
  //   console.log("userBalance=", userBalance);
  //   expect(userBalance.free.toNumber()).toEqual(balance.toNumber()) 
  // })

  // it('hunt', async () => {
  //   const [userBalancePda] = await anchor.web3.PublicKey.findProgramAddressSync(
  //     [Buffer.from("user_balance"), payer.publicKey.toBuffer()],
  //     program.programId
  //   );
  //   const hunter = Keypair.generate()

  //   // 为 hunter 添加 SOL
  //   const airdropSignature = await provider.connection.requestAirdrop(
  //     hunter.publicKey,
  //     2 * anchor.web3.LAMPORTS_PER_SOL // 2 SOL
  //   );
  //   await provider.connection.confirmTransaction(airdropSignature);


  //   const [hunterBalancePda] = await anchor.web3.PublicKey.findProgramAddressSync(
  //     [Buffer.from("user_balance"), hunter.publicKey.toBuffer()],
  //     program.programId
  //   );

  //   const balance = new anchor.BN(1000)
  //   await program.methods
  //     .hunt(payer.publicKey)
  //     .accounts({ 
  //       hunter: hunter.publicKey,
  //       userBalance: userBalancePda,
  //       hunterBalance: hunterBalancePda,
  //     })
  //     .signers([hunter])
  //     .rpc()

  //   const hunterBalance = await program.account.userBalance.fetch(hunterBalancePda)

  //   expect(hunterBalance.free.toNumber()).toEqual(50) 
  // })
})
