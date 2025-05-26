use anchor_lang::prelude::*;

use crate::states::*;
use crate::error::ErrorCode;
use crate::constants::*;
use crate::utils;

#[derive(Accounts)]
pub struct EnterIsland<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
   
    #[account(
      mut,
      seeds = [b"user_bear_balance".as_ref(), signer.key().as_ref()],
      bump,
      constraint = user_bear_balance.user == signer.key()
    )]
    pub user_bear_balance: Account<'info, UserBearBalance>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RequestExitIsland<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
   
    #[account(
      mut,
      seeds = [b"user_bear_balance".as_ref(), signer.key().as_ref()],
      bump,
      constraint = user_bear_balance.user == signer.key()
    )]
    pub user_bear_balance: Account<'info, UserBearBalance>,
}

#[derive(Accounts)]
pub struct ExitIsland<'info> {
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
      seeds=[b"game_vault"],
      bump
    )]
    /// CHECK: This is safe as it's just a PDA used as vault
    game_vault: AccountInfo<'info>,
   
    #[account(
      mut,
      seeds = [b"user_bear_balance".as_ref(), signer.key().as_ref()],
      bump,
      constraint = user_bear_balance.user == signer.key()
    )]
    pub user_bear_balance: Account<'info, UserBearBalance>,

    pub system_program: Program<'info, System>,
}



pub fn enter_island(ctx: Context<EnterIsland>) -> Result<()> {
    require!(ctx.accounts.user_bear_balance.free > 0, ErrorCode::InsufficientBalance); // // Not enough free bear

    ctx.accounts.user_bear_balance.staked = ctx.accounts.user_bear_balance.staked.checked_add(ctx.accounts.user_bear_balance.free).unwrap();
    ctx.accounts.user_bear_balance.free = 0;
    ctx.accounts.user_bear_balance.staked_time = utils::get_current_timestamp();

    Ok(())
}

pub fn request_exit_island(ctx: Context<RequestExitIsland>) -> Result<()> {
    require!(ctx.accounts.user_bear_balance.staked > 0, ErrorCode::InsufficientStakedBalance); // // Not enough free bear
    
    ctx.accounts.user_bear_balance.request_unstake_time = utils::get_current_timestamp();

    Ok(())
}

#[cfg(not(feature = "mainnet"))]
pub fn set_request_exit_island_timestamp(ctx: Context<RequestExitIsland>, timestamp: u64) -> Result<()> {
    require!(ctx.accounts.user_bear_balance.staked > 0, ErrorCode::InsufficientStakedBalance); // // Not enough free bear
    
    ctx.accounts.user_bear_balance.request_unstake_time = timestamp;

    Ok(())
}

pub fn exit_island(ctx: Context<ExitIsland>) -> Result<()> {
    let now = utils::get_current_timestamp();

    require!(ctx.accounts.user_bear_balance.request_unstake_time + 3 * DAY < now, ErrorCode::ExitIslandNotAllowed); 

    let staked_duration = now - ctx.accounts.user_bear_balance.staked_time;
    let mut days = staked_duration / DAY;
    if staked_duration % DAY > 0 {
      days += 1;
    }

    // pay days * 0.1 sol
    let sol_amount = days * LAMPORTS_PER_SOL / 10;

    utils::transfer_sol_from_user_to_vault(
      ctx.accounts.signer.to_account_info(), 
      ctx.accounts.game_vault.to_account_info(), 
      ctx.accounts.system_program.to_account_info(), 
      sol_amount
    )?;

    ctx.accounts.user_bear_balance.staked_time = 0;
    ctx.accounts.user_bear_balance.request_unstake_time = 0;
    ctx.accounts.user_bear_balance.free = ctx.accounts.user_bear_balance.free.checked_add(ctx.accounts.user_bear_balance.staked).unwrap();
    ctx.accounts.user_bear_balance.staked = 0;
    ctx.accounts.user_bear_balance.breed_time = now;
    
    ctx.accounts.game_state.lp_sol_balance = ctx.accounts.game_state.lp_sol_balance.checked_add(sol_amount).unwrap();
    
    Ok(())
}