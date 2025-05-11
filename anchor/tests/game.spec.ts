import * as fs from 'fs'
import * as os from 'os';

import * as anchor from '@coral-xyz/anchor'
import {Program} from '@coral-xyz/anchor'
import {Keypair, PublicKey, Transaction, LAMPORTS_PER_SOL} from '@solana/web3.js'
// import { Connection, LAMPORTS_PER_SOL, clusterApiUrl } from "@solana/web3.js";
import { getAssociatedTokenAddress, createMint, getMint, getAccount } from "@solana/spl-token";
// import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";

import {
	// findMasterEditionPda,
	// findMetadataPda,
	// mplTokenMetadata,
	MPL_TOKEN_METADATA_PROGRAM_ID as MPL_TOKEN_METADATA_PROGRAM_ID_2,
} from "@metaplex-foundation/mpl-token-metadata";

// import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
// import { publicKey } from "@metaplex-foundation/umi";

import {
	TOKEN_PROGRAM_ID,
	ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {HuntingGame} from '../target/types/hunting_game'

export const MPL_TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

export async function findMasterEditionPda(
  mint: PublicKey,
  programId: PublicKey = MPL_TOKEN_METADATA_PROGRAM_ID
): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      programId.toBuffer(),
      mint.toBuffer(),
      Buffer.from("edition"),
    ],
    programId
  );
}

export async function findMetadataPda(
  mint: PublicKey,
  programId: PublicKey = MPL_TOKEN_METADATA_PROGRAM_ID
): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      programId.toBuffer(),
      mint.toBuffer(),
    ],
    programId
  );
}


describe('HuntingGame', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()

  anchor.setProvider(provider)
  const payer = provider.wallet as anchor.Wallet
  const homeDir = os.homedir();
  const program = anchor.workspace.HuntingGame as Program<HuntingGame>

  const seed = JSON.parse(fs.readFileSync(`${homeDir}/.config/solana/id.json`, 'utf-8'))
  const adminKeypair = Keypair.fromSecretKey(new Uint8Array(seed))


  it('Initialize game state', async () => {

    console.log("program", program.programId.toBase58());

    const [gameState] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("game_state")],
      program.programId
    );

    const [gameVault] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("game_vault")],
      program.programId
    );
    // const bearMint = await createMint(
    //   provider.connection, // Solana 连接
    //   adminKeypair,        // Payer
    //   adminKeypair.publicKey, // Mint authority
    //   null,                // Freeze authority (optional)
    //   9                    // Decimals
    // );

    // const bearMintInfo = await provider.connection.getAccountInfo(bearMint);
    // const getMintInfo = await getMint(provider.connection, bearMint);

    const [ bearMint ] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("bear_mint")],
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
    // const [ masterEditionAccount ] = await findMasterEditionPda(hunterCollectionMint, MPL_TOKEN_METADATA_PROGRAM_ID)
    // const [ metadataAccount ] = await findMetadataPda(hunterCollectionMint, MPL_TOKEN_METADATA_PROGRAM_ID)

    await program.methods
      .initialize()
      .accounts({
        admin: adminKeypair.publicKey,
        gameState,
        gameVault,
        bearMint,
        hunterCollectionMint,
        associatedTokenAccount,
        // tokenProgram: TOKEN_PROGRAM_ID,
				// associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
				// systemProgram: anchor.web3.SystemProgram.programId,
				// rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([adminKeypair])
      .rpc()
    
    const hunterCollectionInfo = await getMint(provider.connection, hunterCollectionMint);
    // console.log("hunterCollectionInfo=", hunterCollectionInfo);

    const bearMintInfo = await getMint(provider.connection, bearMint);
    // console.log("bearMintInfo=", bearMintInfo);

    const tokenAccount = await getAccount(provider.connection, associatedTokenAccount)
    // console.log("tokenAccount=", tokenAccount)

    const gameStateData = await program.account.gameState.fetch(gameState.toBase58())
    // console.log("gameStateData=", gameStateData);
    expect(gameStateData.gameInitialized).toBeTruthy()
    expect(gameStateData.bearMint.toBase58()).toEqual(bearMint.toBase58())
    expect(gameStateData.hunterCollectionMint.toBase58()).toEqual(hunterCollectionMint.toBase58())
  })

  it('mint hunter', async () => {
    const signer = adminKeypair

    const [gameState] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("game_state")],
      program.programId
    );

    const [gameVault] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("game_vault")],
      program.programId
    );

    const gameStateData = await program.account.gameState.fetch(gameState.toBase58())


    const hunterId = gameStateData.huntersMinted.add(new anchor.BN(1))
    const hunterIdBytes = hunterId.toArrayLike(Buffer, "le", 8)
    const [ hunterMint ] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("hunter_mint"), hunterIdBytes],
      program.programId
    );

    const associatedTokenAccount = await getAssociatedTokenAddress(
      hunterMint,
      signer.publicKey
    );
    // const [ masterEditionAccount ] = await findMasterEditionPda(hunterCollectionMint, MPL_TOKEN_METADATA_PROGRAM_ID)
    // const [ metadataAccount ] = await findMetadataPda(hunterCollectionMint, MPL_TOKEN_METADATA_PROGRAM_ID)


    const [ hunter ] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("hunter"), hunterMint.toBuffer()],
      program.programId
    );

    const transaction = new Transaction();

    for (let i = 0; i < 3; i++) {
      const hunterId = gameStateData.huntersMinted.add(new anchor.BN(i + 1));
      const hunterIdBytes = hunterId.toArrayLike(Buffer, "le", 8);
  
      const [hunterMint] = await anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("hunter_mint"), hunterIdBytes],
        program.programId
      );
  
      const associatedTokenAccount = await getAssociatedTokenAddress(
        hunterMint,
        signer.publicKey
      );
  
      const [hunter] = await anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("hunter"), hunterMint.toBuffer()],
        program.programId
      );
  
      console.log(`Hunter ${i + 1}:`, hunter.toBase58());
  
      // 构造 mintHunter 的指令
      const instruction = await program.methods
        .mintHunter()
        .accounts({
          signer: signer.publicKey,
          gameState,
          hunterMint,
          associatedTokenAccount,
          hunter,
          gameVault
        })
        .instruction();
  
      // 将指令添加到交易中
      transaction.add(instruction);
    }
  
    // 发送交易
    await provider.sendAndConfirm(transaction, [signer]);
    
    const gameStateDataAfter = await program.account.gameState.fetch(gameState.toBase58())
    expect(gameStateDataAfter.huntersMinted.toNumber()).toEqual(3)
  })

  it('buy bears', async () => {
    const signer = adminKeypair
    const [gameState] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("game_state")],
      program.programId
    );

    const [gameVault] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("game_vault")],
      program.programId
    );

    const [ userBearBalance ] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("user_bear_balance"), signer.publicKey.toBuffer()],
      program.programId
    );

    const gameStateBefore = await program.account.gameState.fetch(gameState.toBase58())

    const paidSolAmount = new anchor.BN(LAMPORTS_PER_SOL * 1)
    await program.methods
      .buyBear(paidSolAmount, new anchor.BN(1))
      .accounts({
        signer: signer.publicKey,
        gameState,
        userBearBalance,
        gameVault
      })
      .signers([signer])
      .rpc()

    const gameStateAfter= await program.account.gameState.fetch(gameState.toBase58())

    console.log("gameStateBefore=", gameStateBefore);
    console.log("gameStateAfter=", gameStateAfter);

    expect(gameStateAfter.lpSolBalance.sub(gameStateBefore.lpSolBalance)).toEqual(paidSolAmount)
  })

  it('sell bears', async () => {
    const signer = adminKeypair
    const [gameState] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("game_state")],
      program.programId
    );

    const [gameVault] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("game_vault")],
      program.programId
    );

    const [ sellerBearBalance ] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("user_bear_balance"), signer.publicKey.toBuffer()],
      program.programId
    );

    const gameStateBefore = await program.account.gameState.fetch(gameState.toBase58())
    const gameVaultInfo = await provider.connection.getAccountInfo(gameVault)

    console.log("gameVaultInfo=", gameVaultInfo);
    const sendBearAmount = new anchor.BN(LAMPORTS_PER_SOL * 0.01)
    await program.methods
      .sellBear(sendBearAmount, new anchor.BN(LAMPORTS_PER_SOL))
      .accounts({
        signer: signer.publicKey,
        gameState,
        gameVault,
        sellerBearBalance,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([signer])
      .rpc()

    const gameStateAfter= await program.account.gameState.fetch(gameState.toBase58())

    console.log("gameStateBefore=", gameStateBefore);
    console.log("gameStateAfter=", gameStateAfter);

    // expect(gameStateAfter.lpSolBalance.sub(gameStateBefore.lpSolBalance)).toEqual(paidSolAmount)
  })


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
