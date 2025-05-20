
use anchor_lang::prelude::*;
use crate::states::*;
use crate::utils;
use crate::error::ErrorCode;

#[derive(Accounts)]
pub struct BuyBear<'info> {
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
  /// CHECK: game sol vault
  game_vault: UncheckedAccount<'info>,

  #[account(
    init_if_needed,
    space = 8 + UserBearBalance::INIT_SPACE,
    payer = signer,
    seeds = [b"user_bear_balance".as_ref(), signer.key().as_ref()],
    bump
  )]
  pub user_bear_balance: Account<'info, UserBearBalance>,
  
  pub system_program: Program<'info, System>,
}

pub fn buy_bear(ctx: Context<BuyBear>, paid_sol_amount: u64, min_received_bear_amount: u64, stake: bool) -> Result<()> {
    if !ctx.accounts.game_state.lp_initialized {
      return Err(ErrorCode::MintingPhase1NotFinished.into());
    }

    utils::transfer_sol_from_user_to_vault(
      ctx.accounts.signer.to_account_info(), 
      ctx.accounts.game_vault.to_account_info(), 
      ctx.accounts.system_program.to_account_info(), 
      paid_sol_amount
    )?;

    ctx.accounts.user_bear_balance.user = ctx.accounts.signer.key();

    let real_sol_amount = paid_sol_amount - paid_sol_amount / 100; // 1% fee to lp
    let received_bear_amount = real_sol_amount * ctx.accounts.game_state.lp_bear_balance / (ctx.accounts.game_state.lp_sol_balance + real_sol_amount);

    if received_bear_amount < min_received_bear_amount {
      return Err(ErrorCode::InsufficientBalance.into());
    }

    if stake {
      ctx.accounts.user_bear_balance.staked = ctx.accounts.user_bear_balance.staked.checked_add(received_bear_amount).unwrap();
    } else {
      ctx.accounts.user_bear_balance.free = ctx.accounts.user_bear_balance.free.checked_add(received_bear_amount).unwrap();
    }

    let now = Clock::get()?.unix_timestamp as u64;
    ctx.accounts.user_bear_balance.breed_time = now;

    ctx.accounts.game_state.lp_sol_balance = ctx.accounts.game_state.lp_sol_balance.checked_add(paid_sol_amount).unwrap();
    ctx.accounts.game_state.lp_bear_balance = ctx.accounts.game_state.lp_bear_balance.checked_sub(received_bear_amount).unwrap();

    Ok(())
  }