use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_instruction;
use anchor_lang::solana_program::program::invoke_signed;
use anchor_spl::token::{
  mint_to, Mint, MintTo, Token, TokenAccount
};
use anchor_spl::metadata::Metadata;
use anchor_spl::associated_token::AssociatedToken;

use mpl_token_metadata::accounts::{ MasterEdition, Metadata as MetadataAccount };

use crate::states::*;
use crate::utils;
use crate::error::ErrorCode;
use crate::constants::*;

#[derive(Accounts)]
pub struct Initialize<'info> {
  #[account(
    mut,
    address = crate::admin::ID @ ErrorCode::InvalidOwner,
  )]
  pub admin: Signer<'info>,

  #[account(
    init,
    payer = admin,
    space = 8 + GameState::INIT_SPACE,
    seeds = [b"game_state"],
    bump
  )]
  pub game_state: Account<'info, GameState>,

  #[account(
    mut,
    seeds=[b"game_vault"],
    bump
  )]
  /// CHECK: This is safe as it's just a PDA used as sol vault
  game_vault: AccountInfo<'info>,

  #[account(
    init_if_needed,
    payer = admin,
    mint::decimals = 0,
    mint::authority = hunter_collection_mint,
    mint::freeze_authority = hunter_collection_mint,
    seeds = [b"hunter_collection_mint"],
    bump
  )]
  pub hunter_collection_mint: Account<'info, Mint>,

  #[account(
    init_if_needed,
    payer = admin,
    associated_token::mint = hunter_collection_mint,
    associated_token::authority = admin
  )]
  pub hunter_collection_token_account: Account<'info, TokenAccount>,

   #[cfg(not(feature = "localnet"))]
  #[account(
    mut,
    address = MetadataAccount::find_pda(&hunter_collection_mint.key()).0
  )]
  /// CHECK: This is safe as it's just a PDA used for metadata
  pub metadata_account: AccountInfo<'info>,

   #[cfg(not(feature = "localnet"))]
  #[account(
    mut,
    address = MasterEdition::find_pda(&hunter_collection_mint.key()).0
  )]
  /// CHECK: This is safe as it's just a PDA used for metadata
  pub master_edition_account: AccountInfo<'info>,

   #[cfg(not(feature = "localnet"))]
  pub token_metadata_program: Program<'info, Metadata>,
  pub system_program: Program<'info, System>,
  pub token_program: Program<'info, Token>,
  pub associated_token_program: Program<'info, AssociatedToken>,
  pub rent: Sysvar<'info, Rent>,
}


#[derive(Accounts)]
pub struct InitializeBearPool<'info> {
  #[account(
    mut,
    address = crate::admin::ID @ ErrorCode::InvalidOwner,
  )]
  pub admin: Signer<'info>,

  #[account(
    mut,
    seeds = [b"game_state"],
    bump,
    constraint = game_state.game_initialized == true
  )]
  pub game_state: Account<'info, GameState>,

  #[account(
    mut,
    seeds=[b"game_vault"],
    bump
  )]
  /// CHECK: This is safe as it's just a PDA used as sol vault
  game_vault: AccountInfo<'info>,

  pub system_program: Program<'info, System>,
}

pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
  require!(!ctx.accounts.game_state.game_initialized, ErrorCode::GameAlreadyInitialized);

  ctx.accounts.game_state.hunters_minted = 0;
  ctx.accounts.game_state.lp_initialized = false;
  ctx.accounts.game_state.lp_sol_balance = 0;
  ctx.accounts.game_state.lp_bear_balance = 0;
  ctx.accounts.game_state.hunter_collection_mint = ctx.accounts.hunter_collection_mint.key();
  ctx.accounts.game_state.game_initialized = true;
  
  // create hunter collection
  let bump = ctx.bumps.hunter_collection_mint;
  let signer: &[&[&[u8]]] = &[&[b"hunter_collection_mint", &[bump]]];
  let cpi_context = CpiContext::new_with_signer(
      ctx.accounts.token_program.to_account_info(),
      MintTo {
          mint: ctx.accounts.hunter_collection_mint.to_account_info(),
          to: ctx.accounts.hunter_collection_token_account.to_account_info(),
          authority: ctx.accounts.hunter_collection_mint.to_account_info(),
      },
      signer,
  );

  mint_to(cpi_context, 1)?;

  let seeds: &[&[u8]] = &[b"game_vault", &[ctx.bumps.game_vault]];

  // create game vault pda to support native sol withdraw from
  invoke_signed(
      &system_instruction::create_account(
          &ctx.accounts.admin.key(),
          &ctx.accounts.game_vault.key(),
          ctx.accounts.rent.minimum_balance(0), // space = 0
          0,
          &ctx.accounts.system_program.key(),
      ),
      &[
          ctx.accounts.admin.to_account_info(),
          ctx.accounts.game_vault.to_account_info(),
          ctx.accounts.system_program.to_account_info(),
      ],
      &[&seeds],
  )?;

  #[cfg(not(feature = "localnet"))]
  utils::create_nft_metadata(
    ctx.accounts.token_metadata_program.to_account_info(),
    ctx.accounts.metadata_account.to_account_info(),
    ctx.accounts.master_edition_account.to_account_info(),
    ctx.accounts.token_program.to_account_info(),
    ctx.accounts.hunter_collection_mint.to_account_info(),
    ctx.accounts.admin.to_account_info(),
    ctx.accounts.admin.to_account_info(),
    ctx.accounts.system_program.to_account_info(),
    ctx.accounts.rent.to_account_info(),
    None,
    "Hunter".to_string(), // name
    "HUNTER".to_string(), // symbol
    "uri".to_string() // uri
  )?;

  Ok(())
}

pub fn initialize_bear_pool(ctx: Context<InitializeBearPool>) -> Result<()> {
  require!(!ctx.accounts.game_state.lp_initialized, ErrorCode::BearPoolAlreadyInitialized);
  require!(ctx.accounts.game_state.hunters_minted == 1000, ErrorCode::MintingPhase1NotEnded);

  require_gt!(ctx.accounts.game_vault.lamports(), 100 * LAMPORTS_PER_SOL);

  ctx.accounts.game_state.lp_initialized = true;
  ctx.accounts.game_state.lp_bear_balance = 1_000_000_000;
  ctx.accounts.game_state.total_supply = 1_000_000_000;

  Ok(())
}

#[cfg(not(feature = "mainnet"))]
pub fn initialize_bear_pool_for_test(ctx: Context<InitializeBearPool>) -> Result<()> {
  let sol_amount = 100 * LAMPORTS_PER_SOL;

  ctx.accounts.game_state.lp_initialized = true;
  ctx.accounts.game_state.lp_sol_balance = sol_amount;
  ctx.accounts.game_state.lp_bear_balance = 1_000_000_000;
  ctx.accounts.game_state.total_supply = 1_000_000_000;

  utils::transfer_sol_from_user_to_vault(
    ctx.accounts.admin.to_account_info(), 
    ctx.accounts.game_vault.to_account_info(), 
    ctx.accounts.system_program.to_account_info(), 
    sol_amount
  )?;
  
  Ok(())
}