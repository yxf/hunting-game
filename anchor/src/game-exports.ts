// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program, BN } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import HuntingGameIDL from '../target/idl/hunting_game.json'
import type { HuntingGame } from '../target/types/hunting_game'

// Re-export the generated IDL and type
export { HuntingGame, HuntingGameIDL }

// The programId is imported from the program IDL.
export const HUNTING_GAME_PROGRAM_ID = new PublicKey(HuntingGameIDL.address)

// This is a helper function to get the Game Anchor program.
export function getGameProgram(provider: AnchorProvider, address?: PublicKey) {
  return new Program({ ...HuntingGameIDL, address: address ? address.toBase58() : HuntingGameIDL.address } as HuntingGame, provider)
}


export function getGameAccounts(adminPubKey: PublicKey) {
  const [gameState] = PublicKey.findProgramAddressSync(
    [Buffer.from("game_state")],
    HUNTING_GAME_PROGRAM_ID
  );

  const [gameVault] = PublicKey.findProgramAddressSync(
    [Buffer.from("game_vault")],
    HUNTING_GAME_PROGRAM_ID
  );

  const [ bearMint ] = PublicKey.findProgramAddressSync(
    [Buffer.from("bear_mint")],
    HUNTING_GAME_PROGRAM_ID
  );

  const [ hunterCollectionMint ] = PublicKey.findProgramAddressSync(
    [Buffer.from("hunter_collection_mint")],
    HUNTING_GAME_PROGRAM_ID
  );

  const associatedTokenAccount = adminPubKey ? getAssociatedTokenAddressSync(
    hunterCollectionMint,
    adminPubKey
  ) : null;

  return {
    gameState,
    gameVault,
    bearMint,
    hunterCollectionMint,
    associatedTokenAccount
  }
}

export function getUserBalanceAccount(account: PublicKey) {
  const [ userBearBalance ] = PublicKey.findProgramAddressSync(
    [Buffer.from("user_bear_balance"), account.toBuffer()],
    HUNTING_GAME_PROGRAM_ID
  );

  return userBearBalance
}

export function getHunterAccounts(account: PublicKey, id: number) {
  const hunterIdBytes = new BN(id).toArrayLike(Buffer, "le", 8)
  const [ hunterMint ] = PublicKey.findProgramAddressSync(
    [Buffer.from("hunter_mint"), hunterIdBytes],
    HUNTING_GAME_PROGRAM_ID
  );

  const hunterMintTokenAccount = getAssociatedTokenAddressSync(
    hunterMint,
    account
  );

  const [ hunter ] = PublicKey.findProgramAddressSync(
    [Buffer.from("hunter"), hunterMint.toBuffer()],
    HUNTING_GAME_PROGRAM_ID
  );

  return {
    hunterMint,
    hunterMintTokenAccount,
    hunter,
  }
}


// This is a helper function to get the program ID for the Game program depending on the cluster.
export function getGameProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
    case 'mainnet-beta':
    default:
      return HUNTING_GAME_PROGRAM_ID
  }
}
