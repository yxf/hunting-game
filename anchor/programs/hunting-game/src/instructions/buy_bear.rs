
use anchor_lang::prelude::*;
use crate::states::*;
use crate::utils;
use crate::error::ErrorCode;
use crate::curve::Curve;

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
    require_gt!(paid_sol_amount, 0);
    require!(ctx.accounts.game_state.lp_initialized, ErrorCode::MintingPhase1NotEnded);

    utils::transfer_sol_from_user_to_vault(
      ctx.accounts.signer.to_account_info(), 
      ctx.accounts.game_vault.to_account_info(), 
      ctx.accounts.system_program.to_account_info(), 
      paid_sol_amount
    )?;

    if ctx.accounts.user_bear_balance.user == Pubkey::default() {
      ctx.accounts.user_bear_balance.user = ctx.accounts.signer.key();
    }
    
    let fees = paid_sol_amount.checked_mul(3).unwrap().checked_div(100).unwrap(); // 3% fee to lp
    let real_sol_amount = paid_sol_amount.checked_sub(fees).unwrap();
    
    let received_bear_amount = Curve::exact_y_input(
      real_sol_amount as u128,
      ctx.accounts.game_state.lp_bear_balance as u128,
      ctx.accounts.game_state.lp_sol_balance as u128
    ) as u64;

    require!(received_bear_amount >= min_received_bear_amount, ErrorCode::InsufficientOutputAmount);
    
    if stake {
      ctx.accounts.user_bear_balance.staked = ctx.accounts.user_bear_balance.staked.checked_add(received_bear_amount).unwrap();
    } else {
      ctx.accounts.user_bear_balance.free = ctx.accounts.user_bear_balance.free.checked_add(received_bear_amount).unwrap();
    }

    ctx.accounts.user_bear_balance.breed_time = utils::get_current_timestamp();

    ctx.accounts.game_state.lp_sol_balance = ctx.accounts.game_state.lp_sol_balance.checked_add(paid_sol_amount).unwrap();
    ctx.accounts.game_state.lp_bear_balance = ctx.accounts.game_state.lp_bear_balance.checked_sub(received_bear_amount).unwrap();

    Ok(())
  }