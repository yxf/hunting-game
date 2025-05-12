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

    const gameVaultInfoBefore = await provider.connection.getAccountInfo(gameVault)
    // console.log("gameVaultInfoBefore=", gameVaultInfoBefore);
    // expect(gameVaultInfoBefore?.lamports).toEqual(0)

    const gameStateBefore = await program.account.gameState.fetch(gameState.toBase58())
    
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

    const gameVaultInfo = await provider.connection.getAccountInfo(gameVault)
    console.log("gameVaultInfo=", gameVaultInfo);
  })

  it('hunt', async () => {
    const signer = adminKeypair
    const [gameState] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("game_state")],
      program.programId
    );

    const hunterId = new anchor.BN(1)
    const hunterIdBytes = hunterId.toArrayLike(Buffer, "le", 8)
    const [ hunterMint ] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("hunter_mint"), hunterIdBytes],
      program.programId
    );

    const associatedTokenAccount = await getAssociatedTokenAddress(
      hunterMint,
      signer.publicKey
    );

    const [ hunter ] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("hunter"), hunterMint.toBuffer()],
      program.programId
    );

    // const fetchHunter = await program.account.hunter.fetch(hunter.toBase58())
    // console.log("fetchHunter=", fetchHunter);

    const [ hunterBearBalance ] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("user_bear_balance"), signer.publicKey.toBuffer()],
      program.programId
    );

    const user = Keypair.generate()

    // buy some bears for the user
    {

      const airdropSignature = await provider.connection.requestAirdrop(
        user.publicKey,
        2 * anchor.web3.LAMPORTS_PER_SOL // 2 SOL
      );
      await provider.connection.confirmTransaction(airdropSignature);

      const [gameVault] = await anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("game_vault")],
        program.programId
      );
  
      const [ userBearBalance ] = await anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("user_bear_balance"), user.publicKey.toBuffer()],
        program.programId
      );
  
      const paidSolAmount = new anchor.BN(LAMPORTS_PER_SOL * 1)
      await program.methods
        .buyBear(paidSolAmount, new anchor.BN(1))
        .accounts({
          signer: user.publicKey,
          gameState,
          userBearBalance,
          gameVault
        })
        .signers([user])
        .rpc()
    }

    const [ userBearBalance ] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("user_bear_balance"), user.publicKey.toBuffer()],
      program.programId
    )
    const fetchedUserBalanceBefore = await program.account.userBearBalance.fetch(userBearBalance.toBase58())
    console.log("fetchedUserBalanceBefore=", fetchedUserBalanceBefore);

    const fetchedHunter = await program.account.hunter.fetch(hunter.toBase58())
    console.log("fetchedHunter=", fetchedHunter);

    await program.methods
      .hunt(user.publicKey, hunterId)
      .accounts({
        signer: signer.publicKey,
        gameState,
        hunterMint,
        associatedTokenAccount,
        hunter,
        hunterBearBalance,
        userBearBalance,
      })
      .signers([signer])
      .rpc()
    
    // const fetchedHunterBalance = await program.account.userBearBalance.fetch(hunterBearBalance.toBase58())
    const fetchedUserBalance = await program.account.userBearBalance.fetch(userBearBalance.toBase58())
    
    const huntedAmount = fetchedUserBalanceBefore.free.sub(fetchedUserBalance.free)
    const expectedAmount = fetchedHunter.huntRate.mul(new anchor.BN(100))
    expect(huntedAmount.toNumber()).toEqual(expectedAmount.toNumber())

  })
})
