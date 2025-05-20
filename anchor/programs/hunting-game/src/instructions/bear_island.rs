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
      bump
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
      bump
    )]
    pub user_bear_balance: Account<'info, UserBearBalance>,
}

#[derive(Accounts)]
pub struct ExitIsland<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

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
      bump
    )]
    pub user_bear_balance: Account<'info, UserBearBalance>,

    pub system_program: Program<'info, System>,
}



pub fn enter_island(ctx: Context<EnterIsland>) -> Result<()> {
    if ctx.accounts.user_bear_balance.free == 0 {
        return Err(ErrorCode::InsufficientBalance.into()); // Not enough free bear
    }
    ctx.accounts.user_bear_balance.staked = ctx.accounts.user_bear_balance.staked.checked_add(ctx.accounts.user_bear_balance.free).unwrap();
    ctx.accounts.user_bear_balance.free = 0;

    Ok(())
}

pub fn request_exit_island(ctx: Context<RequestExitIsland>) -> Result<()> {
    if ctx.accounts.user_bear_balance.staked == 0 {
      return Err(ErrorCode::InsufficientStakedBalance.into()); // Not staked
    }
    ctx.accounts.user_bear_balance.request_unstake_time = Clock::get()?.unix_timestamp as u64;

    Ok(())
}

pub fn exit_island(ctx: Context<ExitIsland>) -> Result<()> {
    let now = Clock::get()?.unix_timestamp as u64;
     if ctx.accounts.user_bear_balance.request_unstake_time + 3 * DAY > now {
      return Err(ErrorCode::InsufficientBalance.into()); // unstake after 72 hours
    }
    let staked_duration = now - ctx.accounts.user_bear_balance.staked_time;

    let mut days = staked_duration / DAY;

    if staked_duration % DAY > 0 {
      days += 1;
    }


    // pay days * 0.1 sol
    let sol_amount = days * LAMPORTS_PER_SOL / 10;

    // let ix = system_instruction::transfer(
    //   &ctx.accounts.signer.key(),
    //   &ctx.accounts.game_vault.key(),
    //   sol_amount,
    // );
    // invoke(
    //   &ix, 
    //   &[
    //     ctx.accounts.signer.to_account_info(),
    //     ctx.accounts.game_vault.to_account_info(),
    //     ctx.accounts.system_program.to_account_info(),
    //   ]
    // )?;

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
    ctx.accounts.user_bear_balance.breed_time = Clock::get()?.unix_timestamp as u64;

    Ok(())
}