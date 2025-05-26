use anchor_lang::prelude::*;

use crate::states::*;
use crate::error::ErrorCode;
use crate::constants::*;
use crate::utils;


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
      bump,
      constraint = user_bear_balance.user == signer.key()
    )]
    pub user_bear_balance: Account<'info, UserBearBalance>,

    pub system_program: Program<'info, System>,
}

pub fn breed_bear(ctx: Context<Breed>) -> Result<()> { 
    require!(ctx.accounts.user_bear_balance.free > 0, ErrorCode::InsufficientBalance);
    
    let now = utils::get_current_timestamp();

    if ctx.accounts.user_bear_balance.breed_time == 0 {
        ctx.accounts.user_bear_balance.breed_time = now;
    }

    require!(ctx.accounts.user_bear_balance.breed_time + DAY < now, ErrorCode::BreedAfter24Hours);

    let breeded_amount = ctx.accounts.user_bear_balance.free.checked_div(200).unwrap();
    ctx.accounts.user_bear_balance.free = ctx.accounts.user_bear_balance.free.checked_add(breeded_amount).unwrap();
    ctx.accounts.user_bear_balance.breed_time = now;
    ctx.accounts.game_state.total_supply = ctx.accounts.game_state.total_supply.checked_add(breeded_amount).unwrap();

    Ok(())
}

#[cfg(not(feature = "mainnet"))]
pub fn set_timestamp_for_test(ctx: Context<Breed>, timestamp: u64) -> Result<()> { 
    ctx.accounts.user_bear_balance.breed_time = timestamp;
    Ok(())
}