import * as fs from 'fs'
import * as os from 'os';
import * as anchor from '@coral-xyz/anchor'
import {Program} from '@coral-xyz/anchor'
import {Keypair, PublicKey, Transaction, LAMPORTS_PER_SOL} from '@solana/web3.js'
import { getAssociatedTokenAddressSync, getMint, getAccount } from "@solana/spl-token";
import {HuntingGame} from '../target/types/hunting_game'

const provider = anchor.AnchorProvider.env()
anchor.setProvider(provider)
const payer = provider.wallet as anchor.Wallet

export const program = anchor.workspace.HuntingGame as Program<HuntingGame>

const seed = JSON.parse(fs.readFileSync(`${os.homedir()}/.config/solana/id.json`, 'utf-8'))
export const adminKeypair = Keypair.fromSecretKey(new Uint8Array(seed))

export async function airdropSol(pubkey: PublicKey, amount: number) {
  const airdropSignature = await provider.connection.requestAirdrop(
    pubkey,
    amount * LAMPORTS_PER_SOL
  );
  await provider.connection.confirmTransaction(airdropSignature);
}

export async function getSolBalance(pubkey: PublicKey) {
  const solBalance = await provider.connection.getBalance(pubkey);
  return solBalance
}

export async function initializeGame() {
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

  // console.log("hunterCollectionMintTokenAccount=", hunterCollectionMintTokenAccount.toBase58());
  // const [ masterEditionAccount ] = await findMasterEditionPda(hunterCollectionMint, MPL_TOKEN_METADATA_PROGRAM_ID)
  // const [ metadataAccount ] = await findMetadataPda(hunterCollectionMint, MPL_TOKEN_METADATA_PROGRAM_ID)

  let gameInitialized: boolean = false;
  let lpInitialized: boolean = false;
  try {
    const gameStateData = await program.account.gameState.fetch(gameState.toBase58());
    gameInitialized = gameStateData.gameInitialized
    lpInitialized = gameStateData.lpInitialized
  } catch(e) {
    
  }

  if(!gameInitialized) {
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
  }
  
  if(!lpInitialized) {
    await program.methods
      .initializeBearPoolForTest()
      .accounts({
          admin: adminKeypair.publicKey,
          gameState,
          gameVault,
      })
      .signers([adminKeypair])
      .rpc()
  }
}
    