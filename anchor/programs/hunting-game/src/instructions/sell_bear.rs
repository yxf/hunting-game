use anchor_lang::prelude::*;
use crate::states::*;
use crate::utils;
use crate::error::ErrorCode;
use crate::curve::Curve;

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
    bump,
    constraint = seller_bear_balance.user == signer.key()
  )]
  pub seller_bear_balance: Account<'info, UserBearBalance>,
  
  pub system_program: Program<'info, System>,
}


pub fn sell_bear(ctx: Context<SellBear>, send_bear_amount: u64, min_received_sol_amount: u64) -> Result<()> {
  require_gt!(send_bear_amount, 0);
  require!(ctx.accounts.game_state.lp_initialized, ErrorCode::MintingPhase1NotEnded);
  require!(ctx.accounts.seller_bear_balance.free >= send_bear_amount, ErrorCode::InsufficientBalance);

  let bump = ctx.bumps.game_vault;
  let signer_seeds: &[&[&[u8]]] = &[&[b"game_vault", &[bump]]];

  let received_sol_amount = Curve::exact_x_input(
    send_bear_amount as u128,
    ctx.accounts.game_state.lp_bear_balance as u128,
    ctx.accounts.game_state.lp_sol_balance as u128
  ) as u64;

  let fees = received_sol_amount.checked_mul(3).unwrap().checked_div(100).unwrap(); // 3% fee to lp
  let sol_amount = received_sol_amount.checked_sub(fees).unwrap();
  
  require!(sol_amount >= min_received_sol_amount, ErrorCode::InsufficientOutputAmount);
  
  ctx.accounts.game_state.lp_bear_balance = ctx.accounts.game_state.lp_bear_balance.checked_add(send_bear_amount).unwrap();
  ctx.accounts.game_state.lp_sol_balance = ctx.accounts.game_state.lp_sol_balance.checked_sub(sol_amount).unwrap();

  utils::transfer_sol_from_vault_to_user(
      ctx.accounts.game_vault.to_account_info(), 
      ctx.accounts.signer.to_account_info(), 
      ctx.accounts.system_program.to_account_info(), 
      sol_amount,
      signer_seeds
  )?;

  ctx.accounts.seller_bear_balance.free = ctx.accounts.seller_bear_balance.free.checked_sub(send_bear_amount).unwrap();
  ctx.accounts.seller_bear_balance.breed_time = Clock::get()?.unix_timestamp as u64;

  Ok(())
}

