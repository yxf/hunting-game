use anchor_lang::prelude::*;
use crate::states::*;
use crate::utils;
use crate::error::ErrorCode;

#[derive(Accounts)]
pub struct SellBear<'info> {
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
    seeds = [b"game_vault"],
    bump
  )]
  /// CHECK: This is safe as it's just a PDA used as sol vault
  game_vault: AccountInfo<'info>,

  #[account(
    mut,
    seeds = [b"user_bear_balance".as_ref(), signer.key().as_ref()],
    bump
  )]
  pub seller_bear_balance: Account<'info, UserBearBalance>,
  
  pub system_program: Program<'info, System>,
}


pub fn sell_bear(ctx: Context<SellBear>, send_bear_amount: u64, min_received_sol_amount: u64) -> Result<()> {
  if !ctx.accounts.game_state.lp_initialized {
      return Err(ErrorCode::MintingPhase1NotFinished.into());
  }

  if ctx.accounts.seller_bear_balance.free < send_bear_amount {
      return Err(ErrorCode::InsufficientBalance.into());
  }

  let bump = ctx.bumps.game_vault;
  let signer_seeds: &[&[&[u8]]] = &[&[b"game_vault", &[bump]]];

  let real_bear_amount = send_bear_amount - send_bear_amount / 100; // 1% fee to lp
  let received_sol_amount = real_bear_amount * ctx.accounts.game_state.lp_bear_balance / (ctx.accounts.game_state.lp_sol_balance - real_bear_amount);

  if received_sol_amount < min_received_sol_amount {
      return Err(ErrorCode::InsufficientBalance.into());
  }

  ctx.accounts.game_state.lp_bear_balance = ctx.accounts.game_state.lp_bear_balance.checked_add(send_bear_amount).unwrap();
  ctx.accounts.game_state.lp_sol_balance = ctx.accounts.game_state.lp_sol_balance.checked_sub(received_sol_amount).unwrap();

  utils::transfer_sol_from_vault_to_user(
      ctx.accounts.game_vault.to_account_info(), 
      ctx.accounts.signer.to_account_info(), 
      ctx.accounts.system_program.to_account_info(), 
      received_sol_amount,
      signer_seeds
  )?;

  ctx.accounts.seller_bear_balance.free = ctx.accounts.seller_bear_balance.free.checked_sub(send_bear_amount).unwrap();
  ctx.accounts.seller_bear_balance.breed_time = Clock::get()?.unix_timestamp as u64;
  Ok(())
}

