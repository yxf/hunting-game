use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
// use anchor_spl::associated_token::AssociatedToken;

use crate::states::*;
use crate::error::ErrorCode;
use crate::constants::*;
use crate::utils;

#[derive(Accounts)]
#[instruction(user: Pubkey, hunter_id: u64)]
pub struct Hunt<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"game_state"],
        bump
    )]
    pub game_state: Account<'info, GameState>,

    #[account(
        mut,
        seeds = [b"hunter_mint".as_ref(), hunter_id.to_le_bytes().as_ref()],
        bump
    )]
    pub hunter_mint: Account<'info, Mint>, // Hunter NFT

    #[account(
      mut,
      constraint = hunter_mint_token_account.owner == signer.key(),
      constraint = hunter_mint_token_account.mint == hunter_mint.key()
    )]
    pub hunter_mint_token_account: Account<'info, TokenAccount>, // Hunter NFT token account


    #[account(
      mut,
      seeds = [b"hunter".as_ref(), hunter_mint.key().as_ref()],
      bump
    )]
    pub hunter: Account<'info, Hunter>,

    #[account(
      mut,
      seeds = [b"user_bear_balance".as_ref(), user.key().as_ref()],
      bump,
      constraint = user_bear_balance.user == user
    )]
    pub user_bear_balance: Account<'info, UserBearBalance>,

    #[account(
      init_if_needed,
      space = 8 + UserBearBalance::INIT_SPACE,
      payer = signer,
      seeds = [b"user_bear_balance".as_ref(), signer.key().as_ref()],
      bump
    )]
    pub hunter_bear_balance: Account<'info, UserBearBalance>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}


pub fn hunt(ctx: Context<Hunt>, user: Pubkey, hunter_id: u64) -> Result<()> {
    let now = utils::get_current_timestamp();

    require!(ctx.accounts.hunter.last_hunt_time + DAY < now, ErrorCode::AlreadyHunted);
    require!(ctx.accounts.hunter.token_id == hunter_id, ErrorCode::NoPermission); // invalid hunter id
    require!(ctx.accounts.hunter_mint.supply == 1, ErrorCode::InvalidHunterMint); // invalid hunter mint
    require!(ctx.accounts.hunter_mint_token_account.owner == ctx.accounts.signer.key(), ErrorCode::NotHunterOwner); // invalid hunter mint
    require!(ctx.accounts.user_bear_balance.user == user, ErrorCode::InvalidBearBalance);
    require!(ctx.accounts.user_bear_balance.hunted_time + DAY < now, ErrorCode::AlreadyHunted); // already hunted
    require!(ctx.accounts.user_bear_balance.free > 0, ErrorCode::InsufficientBalance); // insufficient balance

    let hunted_amount = ctx.accounts.hunter.hunt_rate * 100 + ctx.accounts.hunter.hunt_rate * ctx.accounts.hunter.hunted_count / 100;
    require!(ctx.accounts.user_bear_balance.free > hunted_amount, ErrorCode::InsufficientBalance); // hunted amount should be greater than 0
   
    ctx.accounts.user_bear_balance.free = ctx.accounts.user_bear_balance.free.checked_sub(hunted_amount).unwrap(); 

    // 20% of hunted amount to hunter
    let rewards = hunted_amount * 20 / 100;
    let burned_amount = hunted_amount  - rewards;
    if ctx.accounts.hunter_bear_balance.user == Pubkey::default() {
        ctx.accounts.hunter_bear_balance.user = ctx.accounts.signer.key();
    }
    ctx.accounts.hunter_bear_balance.user = ctx.accounts.signer.key();
    ctx.accounts.hunter_bear_balance.free = ctx.accounts.hunter_bear_balance.free.checked_add(rewards).unwrap();
    ctx.accounts.hunter_bear_balance.breed_time = now;

    ctx.accounts.game_state.total_supply = ctx.accounts.game_state.total_supply.checked_sub(burned_amount).unwrap();

    ctx.accounts.hunter.last_hunt_time = now;
    ctx.accounts.hunter.hunted_count += 1;

    ctx.accounts.user_bear_balance.hunted_time = now;

    Ok(())
}