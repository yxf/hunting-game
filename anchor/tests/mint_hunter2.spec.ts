import * as anchor from '@coral-xyz/anchor'
import {Program} from '@coral-xyz/anchor'
import {Keypair, PublicKey, Transaction, LAMPORTS_PER_SOL} from '@solana/web3.js'
import { getAssociatedTokenAddressSync, getMint, getAccount } from "@solana/spl-token";

import {HuntingGame} from '../target/types/hunting_game'
import { program, adminKeypair, initializeGame, airdropSol } from './helper'

describe('HuntingGame:mintHunter2', () => {
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)

  beforeEach(async () => {
    await initializeGame()
  })

  it('mintHunter', async () => {
    const [gameState] = PublicKey.findProgramAddressSync(
      [Buffer.from("game_state")],
      program.programId
    );

    const [gameVault] = PublicKey.findProgramAddressSync(
      [Buffer.from("game_vault")],
      program.programId
    );

    const gameStateData = await program.account.gameState.fetch(gameState.toBase58())


    const hunterId = gameStateData.huntersMinted.add(new anchor.BN(1))
    const hunterIdBytes = hunterId.toArrayLike(Buffer, "le", 8)

    const [hunterMint] = PublicKey.findProgramAddressSync(
      [Buffer.from("hunter_mint"), hunterIdBytes],
      program.programId
    );

    const hunterMintTokenAccount = getAssociatedTokenAddressSync(
      hunterMint,
      adminKeypair.publicKey
    );

    const [hunter] = PublicKey.findProgramAddressSync(
      [Buffer.from("hunter"), hunterMint.toBuffer()],
      program.programId
    );

    const txid = await program.methods
      .mintHunter2()
      .accounts({
        signer: adminKeypair.publicKey,
        gameState,
        gameVault,
        hunterMint,
        hunterMintTokenAccount,
        hunter
      })
      .signers([adminKeypair])
      .rpc()

      
    const hunterMintInfo = await getMint(provider.connection, hunterMint);
    // console.log("hunterMintInfo", hunterMintInfo)
    expect(Number(hunterMintInfo.supply)).toEqual(1)

    const hunterMintTokenAccountInfo = await getAccount(provider.connection, hunterMintTokenAccount)
    // console.log("hunterMintTokenAccountInfo", hunterMintTokenAccountInfo)
    expect(Number(hunterMintTokenAccountInfo.amount)).toEqual(1)
    expect(hunterMintTokenAccountInfo.owner).toEqual(adminKeypair.publicKey)

    const hunterInfo =  await program.account.hunter.fetch(hunter.toBase58())
    expect(hunterInfo.tokenId.toNumber()).toEqual(hunterId.toNumber())

    const gameStateAfter = await program.account.gameState.fetch(gameState.toBase58())

    console.log("gameStateAfter=", gameStateAfter)
    
  })

//   it('mint multi hunters', async () => {
//     const [gameState] = PublicKey.findProgramAddressSync(
//       [Buffer.from("game_state")],
//       program.programId
//     );

//     const [gameVault] = PublicKey.findProgramAddressSync(
//       [Buffer.from("game_vault")],
//       program.programId
//     );

    
//     const transaction = new Transaction();
//     const signer = Keypair.generate()

//     await airdropSol(signer.publicKey, 10)
    
//     const gameStateData = await program.account.gameState.fetch(gameState.toBase58())

//     for(let i = 0; i < 5; i++) {
//       const hunterId = gameStateData.huntersMinted.add(new anchor.BN(1 + i))
//       const hunterIdBytes = hunterId.toArrayLike(Buffer, "le", 8)

//       const [hunterMint] = PublicKey.findProgramAddressSync(
//         [Buffer.from("hunter_mint"), hunterIdBytes],
//         program.programId
//       );

//       const hunterMintTokenAccount = getAssociatedTokenAddressSync(
//         hunterMint,
//         signer.publicKey
//       );

//       const [hunter] = PublicKey.findProgramAddressSync(
//         [Buffer.from("hunter"), hunterMint.toBuffer()],
//         program.programId
//       );

//       const instruction = await program.methods
//         .mintHunter()
//         .accounts({
//           signer: signer.publicKey,
//           gameState,
//           gameVault,
//           hunterMint,
//           hunterMintTokenAccount,
//           hunter
//         }).instruction()

//       // 将指令添加到交易中
//       transaction.add(instruction);
//     }

//     // 发送交易
//     await provider.sendAndConfirm(transaction, [signer]);


//     const gameStateAfter = await program.account.gameState.fetch(gameState.toBase58())
//     expect(gameStateAfter.huntersMinted.toNumber()).toEqual(6)

//     const allHunterMints = await program.account.hunter.all()

//     for(const { publicKey, account } of allHunterMints) {
      
//       const [hunterMint] = PublicKey.findProgramAddressSync(
//         [Buffer.from("hunter_mint"), account.tokenId.toArrayLike(Buffer, "le", 8)],
//         program.programId
//       );

//       const [hunter] = PublicKey.findProgramAddressSync(
//         [Buffer.from("hunter"), hunterMint.toBuffer()],
//         program.programId
//       );

//       if(account.tokenId.toNumber() > 1) { 
//         const hunterMintTokenAccount = getAssociatedTokenAddressSync(
//           hunterMint,
//           signer.publicKey
//         );

//         const accountInfo = await getAccount(provider.connection, hunterMintTokenAccount)
//         // console.log("accountInfo=", hunterMintTokenAccount.toBase58(), accountInfo)
//         expect(Number(accountInfo.amount)).toEqual(1)
//         expect(accountInfo.owner).toEqual(signer.publicKey)
//       }
      
//       expect(publicKey.toBase58()).toEqual(hunter.toBase58()) 
//     }

//   })
})
