#![allow(clippy::result_large_err)]
use anchor_lang::prelude::*;

pub mod utils;
pub mod error;
pub mod states;
pub mod instructions;

use instructions::*;

declare_id!("4td2N7STVV1zEyrPBbf6bEhq5LW7GkTT7kpNwt762nMW");

pub mod admin {
  use super::{pubkey, Pubkey};
  pub const ID: Pubkey = pubkey!("56LCisjxabaqa2zou4KSjxrPVudEXy7McqPEzx5GvfaS");
}

pub mod constants {
  pub const LAMPORTS_PER_SOL: u64 = 1_000_000_000;
  pub const DAY: u64 = 24 * 60 * 60 * 1000;

  // pub const GAME_VAULT_SEED: &[u8] = b"game_vault";
  // pub const GAME_STATE_SEED: &[u8] = b"game_state";
  // pub const HUNTER_MINT_SEED: &[u8] = b"hunter_mint";
  // pub const HUNTER_SEED: &[u8] = b"hunter";
  // pub const USER_BEAR_BALANCE_SEED: &[u8] = b"user_bear_balance";
}


#[program]
pub mod hunting_game {
  use super::*;

  pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    instructions::initialize(ctx)
  }

  pub fn initialize_bear_pool(ctx: Context<InitializeBearPool>) -> Result<()> {
    instructions::initialize_bear_pool(ctx)
  }

  #[cfg(not(feature = "mainnet"))]
  pub fn initialize_bear_pool_for_test(ctx: Context<InitializeBearPool>) -> Result<()> {
    instructions::initialize_bear_pool(ctx)
  }

  pub fn mint_hunter(ctx: Context<MintHunter>) -> Result<()> {
    instructions::mint_hunter(ctx)
  }

  pub fn mint_hunter2(ctx: Context<MintHunter>) -> Result<()> {
    instructions::mint_hunter2(ctx)
  }

  pub fn buy_bear(ctx: Context<BuyBear>, paid_sol_amount: u64, min_received_bear_amount: u64, stake: bool) -> Result<()> {
    instructions::buy_bear(ctx, paid_sol_amount, min_received_bear_amount, stake)
  }

  pub fn sell_bear(ctx: Context<SellBear>, send_bear_amount: u64, min_received_sol_amount: u64) -> Result<()> {
    instructions::sell_bear(ctx, send_bear_amount, min_received_sol_amount)
  }

  pub fn breed_bear(ctx: Context<Breed>) -> Result<()> { 
    instructions::breed_bear(ctx)
  }

  pub fn hunt(ctx: Context<Hunt>, user: Pubkey, hunter_id: u64) -> Result<()> {
    instructions::hunt(ctx, user, hunter_id)
  }

  pub fn enter_island(ctx: Context<EnterIsland>) -> Result<()> {
    instructions::enter_island(ctx)
  }

  pub fn request_exit_island(ctx: Context<RequestExitIsland>) -> Result<()> {
    instructions::request_exit_island(ctx)
  }

  pub fn exit_island(ctx: Context<ExitIsland>) -> Result<()> {
    instructions::exit_island(ctx)
  }
}