use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
// use anchor_spl::associated_token::AssociatedToken;

use crate::states::*;
use crate::error::ErrorCode;
use crate::constants::*;

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
      bump
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

    msg!("Hunting user {} by hunter {}", user, hunter_id);

    let now = Clock::get()?.unix_timestamp as u64;

    if ctx.accounts.hunter.last_hunt_time + DAY > now {
        return Err(ErrorCode::AlreadyHunted.into()); // hunter can only hunt once per day
    }

    if ctx.accounts.hunter.token_id != hunter_id {
        return Err(ErrorCode::NoPermission.into()); // invalid hunter id
    }

    if ctx.accounts.hunter_mint.supply == 0 {
        return Err(ErrorCode::InvalidHunterMint.into()); // no hunter
    }

    if ctx.accounts.hunter_mint_token_account.owner != ctx.accounts.signer.key() {
        return Err(ErrorCode::NotHunterOwner.into()); // not hunter owner
    }

    if ctx.accounts.user_bear_balance.user != user {
        return Err(ErrorCode::InvalidBearBalance.into()); // invalid user bear balance
    }

    if ctx.accounts.user_bear_balance.hunted_time + DAY > now {
        return Err(ErrorCode::AlreadyHunted.into()); // already hunted
    }

    let hunted_amount = ctx.accounts.hunter.hunt_rate * 100 + ctx.accounts.hunter.hunt_rate * ctx.accounts.hunter.hunted_count / 100;

    if ctx.accounts.user_bear_balance.free < hunted_amount {
        return Err(ErrorCode::InsufficientBalance.into());
    }

    ctx.accounts.user_bear_balance.free = ctx.accounts.user_bear_balance.free.checked_sub(hunted_amount).unwrap(); 

    // 20% of hunted amount to hunter
    let rewards = hunted_amount * 20 / 100;
    let burned_amount = hunted_amount  - rewards;
    ctx.accounts.hunter_bear_balance.free = ctx.accounts.hunter_bear_balance.free.checked_add(rewards).unwrap();
    ctx.accounts.hunter_bear_balance.breed_time = now;
    ctx.accounts.game_state.total_supply = ctx.accounts.game_state.total_supply.checked_sub(burned_amount).unwrap();


    ctx.accounts.hunter.last_hunt_time = now;
    ctx.accounts.hunter.hunted_count += 1;

    ctx.accounts.user_bear_balance.hunted_time = now;

    Ok(())
}