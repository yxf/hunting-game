use anchor_lang::prelude::*;

use crate::states::*;
use crate::error::ErrorCode;
use crate::constants::*;

#[derive(Accounts)]
pub struct Breed<'info> {
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
      seeds = [b"user_bear_balance".as_ref(), signer.key().as_ref()],
      bump
    )]
    pub user_bear_balance: Account<'info, UserBearBalance>,

    pub system_program: Program<'info, System>,
}

pub fn breed_bear(ctx: Context<Breed>) -> Result<()> { 
    
    if ctx.accounts.user_bear_balance.free == 0 {
        return Err(ErrorCode::InsufficientBalance.into()); // Not enough free bear
    }
    let now = Clock::get()?.unix_timestamp as u64;

    if ctx.accounts.user_bear_balance.breed_time == 0 {
        ctx.accounts.user_bear_balance.breed_time = now;
    }

    if ctx.accounts.user_bear_balance.breed_time + DAY < now {
        return Err(ErrorCode::BreedAfter24Hours.into()); // breed after 24 hours
    }

    let breeded_amount = ctx.accounts.user_bear_balance.free.checked_div(100).unwrap();
    ctx.accounts.user_bear_balance.free = ctx.accounts.user_bear_balance.free.checked_add(breeded_amount).unwrap();
    ctx.accounts.user_bear_balance.breed_time = now;
    ctx.accounts.game_state.total_supply = ctx.accounts.game_state.total_supply.checked_add(breeded_amount).unwrap();

    Ok(())
}