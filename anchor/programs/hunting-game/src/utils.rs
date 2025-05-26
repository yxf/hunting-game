use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use anchor_spl::metadata::{
  CreateMetadataAccountsV3, 
  CreateMasterEditionV3,
  create_master_edition_v3,
  create_metadata_accounts_v3,
};
use mpl_token_metadata::types::{ Collection, DataV2 };

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

pub fn create_nft_metadata<'info>(
  token_metadata_program: AccountInfo<'info>,
  metadata_account: AccountInfo<'info>,
  master_edition_account: AccountInfo<'info>,
  token_program: AccountInfo<'info>,
  mint: AccountInfo<'info>,
  mint_authority: AccountInfo<'info>,
  payer: AccountInfo<'info>,
  system_program: AccountInfo<'info>,
  rent: AccountInfo<'info>,
  collection_key: Option<Pubkey>,
  name: String,
  symbol: String,
  uri: String
) -> Result<()> {

  let cpi_context = CpiContext::new(
    token_metadata_program.clone(),
    CreateMetadataAccountsV3 {
      metadata: metadata_account.clone(),
      mint: mint.clone(),
      mint_authority: mint_authority.clone(),
      update_authority: mint_authority.clone(),
      payer: payer.clone(),
      system_program: system_program.clone(),
      rent: rent.clone(),
    }
  );

  let data_v2 = DataV2 {
    name: name,
    symbol: symbol,
    uri: uri,
    seller_fee_basis_points: 0,
    creators: None,
    collection: match collection_key {
      Some(key) => Some(Collection {
        verified: true,
        key: key,
      }),
      None => None,
    },
    uses: None,
  };

  create_metadata_accounts_v3(cpi_context, data_v2, false, true, None)?;

  // create master edition account
  let cpi_context = CpiContext::new(
    token_metadata_program,
    CreateMasterEditionV3 {
      edition: master_edition_account,
      mint: mint,
      update_authority: mint_authority.clone(),
      mint_authority: mint_authority,
      payer: payer,
      metadata: metadata_account,
      token_program: token_program,
      system_program: system_program,
      rent: rent,
    },
  );

  create_master_edition_v3(cpi_context, None)?;

  Ok(())
}


pub fn get_hunter_price(bear_supply: u64) -> u64 {
  let base = 100_000.0;
  let k = 5.0;
  let b = (bear_supply / 10000) as f64;
  let price =  200_000_000.0 * ((k * (base - b) / base).exp());
  return price.round() as u64;
}

pub fn get_current_timestamp() -> u64 {
  return Clock::get().unwrap().unix_timestamp as u64;
}
