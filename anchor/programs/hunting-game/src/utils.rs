use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

pub fn transfer_sol_from_user_to_vault<'info>(
  from: AccountInfo<'info>,
  to_vault: AccountInfo<'info>,
  system_program: AccountInfo<'info>,
  amount: u64,
) -> Result<()> {
  let cpi_context = CpiContext::new(
      system_program,
      Transfer {
        from: from,
        to: to_vault,
      },
  );
  transfer(cpi_context, amount)?;

  Ok(())
}

pub fn transfer_sol_from_vault_to_user<'info>(
  from_vault: AccountInfo<'info>,
  to: AccountInfo<'info>,
  system_program: AccountInfo<'info>,
  amount: u64,
  signer_seeds: &[&[&[u8]]],
) -> Result<()> {

  let cpi_context = CpiContext::new(
    system_program,
    Transfer {
      from: from_vault,
      to: to,
    },
  )
  .with_signer(signer_seeds);

  transfer(cpi_context, amount)?;

  Ok(())
}


pub fn get_hunter_price(bear_supply: u64) -> u64 {
  let base = 100_000.0;
  let k = 5.0;
  let b = (bear_supply / 1000) as f64;
  let price =  200_000_000.0 * ((k * (base - b) / base).exp());
  return price.round() as u64;
}

pub fn timestamp_now() -> u64 {
  return Clock::get().unwrap().unix_timestamp as u64;
}
