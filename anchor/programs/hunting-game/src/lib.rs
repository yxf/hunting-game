#![allow(clippy::result_large_err)]
use anchor_lang::solana_program::system_instruction;
use anchor_lang::solana_program::program::invoke;
use anchor_lang::prelude::*;

use anchor_spl::token::{burn, mint_to, Burn, Mint, MintTo, Token, TokenAccount};
use anchor_spl::metadata::{
  CreateMetadataAccountsV3, 
  CreateMasterEditionV3,
  create_master_edition_v3,
  create_metadata_accounts_v3,
  Metadata,
};
use anchor_spl::associated_token::AssociatedToken;

use mpl_token_metadata::accounts::{ MasterEdition, Metadata as MetadataAccount };
use mpl_token_metadata::types::{Collection, DataV2};

declare_id!("EQCmne3t4y6MA3LXjPE1m6J698QKVbDrbraVZfPSzFHy");

const ADMIN_PUBKEY: Pubkey = pubkey!("88be4vXQGw9za3YCukkdLJSNhyvsnTMbgFWttevBfShf");


#[program]
pub mod hunting_game {
  use super::*;

  pub fn initialize(ctx: Context<InitializeGameState>, uri: String) -> Result<()> {
    if ctx.accounts.game_state.game_initialized {
      return Err(ErrorCode::GameAlreadyInitialized.into());
    }
    ctx.accounts.game_state.authority = ctx.accounts.admin.key();
    ctx.accounts.game_state.hunters_minted = 0;
    ctx.accounts.game_state.lp_initialized = false;
    ctx.accounts.game_state.bear_mint = ctx.accounts.bear_mint.key();
    ctx.accounts.game_state.lp_sol_balance = 0;
    ctx.accounts.game_state.lp_bear_balance = 0;
    ctx.accounts.game_state.hunter_collection_mint = ctx.accounts.hunter_collection_mint.key();
    ctx.accounts.game_state.game_initialized = true;
    
    // create hunter collection
    let bump = ctx.bumps.hunter_collection_mint;
    let signer: &[&[&[u8]]] = &[&[b"hunter_collection_mint", &[bump]]];
    let cpi_context = CpiContext::new_with_signer(
      ctx.accounts.token_program.to_account_info(),
      MintTo {
          mint: ctx.accounts.hunter_collection_mint.to_account_info(),
          to: ctx.accounts.associated_token_account.to_account_info(),
          authority: ctx.accounts.hunter_collection_mint.to_account_info(),
      },
      signer,
    );

    mint_to(cpi_context, 1)?;

    let cpi_context = CpiContext::new(
      ctx.accounts.token_metadata_program.to_account_info(),
      CreateMetadataAccountsV3 {
          metadata: ctx.accounts.metadata_account.to_account_info(),
          mint: ctx.accounts.hunter_collection_mint.to_account_info(),
          mint_authority: ctx.accounts.admin.to_account_info(),
          update_authority: ctx.accounts.admin.to_account_info(),
          payer: ctx.accounts.admin.to_account_info(),
          system_program: ctx.accounts.system_program.to_account_info(),
          rent: ctx.accounts.rent.to_account_info(),
      }
    );

    let data_v2 = DataV2 {
        name: "Hunter".to_string(),
        symbol: "Hunter".to_string(),
        uri: uri,
        seller_fee_basis_points: 0,
        creators: None,
        collection: None,
        uses: None,
    };

    create_metadata_accounts_v3(cpi_context, data_v2, false, true, None)?;

    // create master edition account
    let cpi_context = CpiContext::new(
        ctx.accounts.token_metadata_program.to_account_info(),
        CreateMasterEditionV3 {
            edition: ctx.accounts.master_edition_account.to_account_info(),
            mint: ctx.accounts.hunter_collection_mint.to_account_info(),
            update_authority: ctx.accounts.admin.to_account_info(),
            mint_authority: ctx.accounts.admin.to_account_info(),
            payer: ctx.accounts.admin.to_account_info(),
            metadata: ctx.accounts.metadata_account.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
            rent: ctx.accounts.rent.to_account_info(),
        },
    );

    create_master_edition_v3(cpi_context, None)?;

    Ok(())
  }


  pub fn mint_hunter(ctx: Context<MintHunter>) -> Result<()> {

    if ctx.accounts.hunter_mint.supply == 0 {
      return Err(ErrorCode::GameAlreadyInitialized.into());
    }
    
    let hunter_id = ctx.accounts.game_state.hunters_minted.checked_add(1).unwrap(); 
    
    let hunter_id_bytes = hunter_id.to_le_bytes();
    let bump = ctx.bumps.hunter_mint;
    let signer: &[&[&[u8]]] = &[&[b"hunter_mint", hunter_id_bytes.as_ref(), &[bump]]];

    let cpi_context = CpiContext::new_with_signer(
      ctx.accounts.token_program.to_account_info(),
      MintTo {
          mint: ctx.accounts.hunter_mint.to_account_info(),
          to: ctx.accounts.associated_token_account.to_account_info(),
          authority: ctx.accounts.hunter_mint.to_account_info(),
      },
      signer,
    );

    mint_to(cpi_context, 1)?;

    const sol_amount: u64 = 1 * 1_000_000_000; // 1 SOL

    let ix = system_instruction::transfer(
      &ctx.accounts.signer.key(),
      &ctx.accounts.game_state.key(),
      sol_amount, // 1 SOL
    );
    invoke(  
      &ix, 
      &[
        ctx.accounts.signer.to_account_info(),
        ctx.accounts.game_state.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
      ],
    )?;

    ctx.accounts.game_state.hunters_minted = ctx.accounts.game_state.hunters_minted.checked_add(1).unwrap();
    ctx.accounts.game_state.lp_sol_balance = ctx.accounts.game_state.lp_sol_balance.checked_add(sol_amount).unwrap();

    let cpi_context = CpiContext::new(
      ctx.accounts.token_metadata_program.to_account_info(),
      CreateMetadataAccountsV3 {
          metadata: ctx.accounts.metadata_account.to_account_info(),
          mint: ctx.accounts.hunter_mint.to_account_info(),
          mint_authority: ctx.accounts.authority.to_account_info(),
          update_authority: ctx.accounts.authority.to_account_info(),
          payer: ctx.accounts.signer.to_account_info(),
          system_program: ctx.accounts.system_program.to_account_info(),
          rent: ctx.accounts.rent.to_account_info(),
      },
    );
    
    let data_v2 = DataV2 {
        name: "Hunter".to_string(),
        symbol: format!("Hunter #{}", hunter_id),
        uri: "uri".to_string(),
        seller_fee_basis_points: 0,
        creators: None,
        collection: Some(Collection {
            verified: true,
            key: ctx.accounts.game_state.hunter_collection_mint,
        }),
        uses: None,
    };

    create_metadata_accounts_v3(cpi_context, data_v2, false, false, None)?;

    ctx.accounts.hunter.token_id = hunter_id;

    let clock = Clock::get()?;
    let random_seed = u64::from_le_bytes(
        clock
        .slot
        .to_le_bytes()[0..8]
        .try_into()
        .unwrap(),
    );

    ctx.accounts.hunter.hunt_rate = 100 + (random_seed % 100);

    Ok(())
  }

  // pub fn buy_bear(ctx: Context<BuyBear>, paid_sol_amount: u64, min_received_bear_amount: 64) -> Result<()> {

  //   let ix = system_instruction::transfer(
  //     &ctx.accounts.signer.key(),
  //     &ctx.accounts.game_state.key(),
  //     paid_sol_amount,
  //   );
  //   invoke(  
  //     &ix, 
  //     &[
  //       ctx.accounts.signer.to_account_info(),
  //       ctx.accounts.game_state.to_account_info(),
  //       ctx.accounts.system_program.to_account_info(),
  //     ],
  //   )?;

  //   ctx.accounts.game_state.lp_sol_balance = ctx.accounts.game_state.lp_sol_balance.checked_add(paid_sol_amount).unwrap();

  //   Ok(())
  // }

  // pub fn sell_bear(ctx: Context<BuyBear>, send_bear_amount: u64, min_received_sol_amount: 64) -> Result<()> {

  //   let ix = system_instruction::transfer(
  //     &ctx.accounts.game_state.key(),
  //     &ctx.accounts.signer.key(),
  //     paid_sol_amount,
  //   );
  //   invoke(
  //     &ix, 
  //     &[
  //       ctx.accounts.game_state.to_account_info(),
  //       ctx.accounts.signer.to_account_info(),
  //       ctx.accounts.system_program.to_account_info(),
  //     ],
  //   )?;

  //   ctx.accounts.game_state.lp_bear_balance = ctx.accounts.game_state.lp_bear_balance.checked_add(send_bear_amount).unwrap();

  //   Ok(())
  // }



  // pub fn set_user_balance(ctx: Context<SetUserBalance>, free_balance: u64) -> Result<()> {
  //   ctx.accounts.user_balance.user = ctx.accounts.user.key();
  //   ctx.accounts.user_balance.free = free_balance;
  //   ctx.accounts.user_balance.staked = 0;
  
    
  //   let ix = system_instruction::transfer(
  //     &ctx.accounts.user.key(),
  //     &ctx.accounts.user_balance.key(), 
  //     free_balance,
  //   );
  //   invoke(  
  //     &ix, 
  //     &[
  //       ctx.accounts.user.to_account_info(),
  //       ctx.accounts.user_balance.to_account_info(),
  //       ctx.accounts.system_program.to_account_info(),
  //     ],
  //   )?;

  //   msg!("Transfer {} lamports from {} to {}", free_balance, ctx.accounts.user.key(), ctx.accounts.user_balance.key());
  //   msg!("User balance initialized for: {:?}", ctx.accounts.user.key());
  //   msg!("Free balance: {:?}", ctx.accounts.user_balance.free);
  //   msg!("Staked balance: {:?}", ctx.accounts.user_balance.staked);
  //   Ok(())
  // }

  // pub fn hunt(ctx: Context<Hunt>, user: Pubkey) -> Result<()> {
  //   if ctx.accounts.user_balance.user != user {
  //     return Err(ErrorCode::NoPermission.into());
  //   }
  //   let hunted_amount = 100;
  //   if ctx.accounts.user_balance.free < hunted_amount {
  //     return Err(ErrorCode::InsufficientBalance.into());
  //   }
  //   ctx.accounts.user_balance.free = ctx.accounts.user_balance.free.checked_sub(hunted_amount).unwrap();
  //   ctx.accounts.hunter_balance.free = ctx.accounts.hunter_balance.free.checked_add(hunted_amount / 2).unwrap();
  //   msg!("User {} has been decreased {:?}", user, hunted_amount);
  //   msg!("User {} has been increased {:?}", user, hunted_amount / 2);
  //   Ok(())
  // }
}

#[derive(Accounts)]
pub struct InitializeGameState<'info> {
  #[account(
    mut,
    address = ADMIN_PUBKEY
  )]
  pub admin: Signer<'info>,

  #[account(  
    init,
    payer = admin,
    space = 8 + GameState::INIT_SPACE,
    seeds = [b"game_state"],
    bump
  )]
  pub game_state: Account<'info, GameState>,

  #[account(
    init,
    payer = admin,
    space = 8 + Mint::LEN,
    seeds = [b"bear_mint"],
    bump
  )]
  pub bear_mint: Account<'info, Mint>,

  #[account(
    init_if_needed,
    payer = admin,
    mint::decimals = 0,
    mint::authority = hunter_collection_mint,
    seeds = [b"hunter_collection_mint"],
    bump
  )]
  pub hunter_collection_mint: Account<'info, Mint>,

  #[account(
    init_if_needed,
    payer = admin,
    associated_token::mint = hunter_collection_mint,
    associated_token::authority = admin
  )]
  pub associated_token_account: Account<'info, TokenAccount>,

  #[account(
    mut,
    address = MetadataAccount::find_pda(&hunter_collection_mint.key()).0
  )]
  /// CHECK: This is safe as it's just a PDA used for signing
  pub metadata_account: AccountInfo<'info>,

  #[account(
    mut,
    address = MasterEdition::find_pda(&hunter_collection_mint.key()).0
  )]
  /// CHECK: This is safe as it's just a PDA used for signing
  pub master_edition_account: AccountInfo<'info>,

  pub system_program: Program<'info, System>,
  pub token_program: Program<'info, Token>,
  pub associated_token_program: Program<'info, AssociatedToken>,
  pub token_metadata_program: Program<'info, Metadata>,
  pub rent: Sysvar<'info, Rent>,
}



#[derive(Accounts)]
#[instruction(hunter_id: u64)]
pub struct MintHunter<'info> {
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
    constraint = game_state.authority == authority.key()
  )]
  /// CHECK: This is safe as it's just a PDA used to check authority
  pub authority: AccountInfo<'info>,

  #[account(
      init_if_needed,
      payer = signer,
      mint::decimals = 0,
      mint::authority = hunter_mint,
      seeds = [b"hunter".as_ref(), hunter_id.to_le_bytes().as_ref()],
      bump
  )]
  pub hunter_mint: Account<'info, Mint>, // Hunter NFT

  #[account(
    init_if_needed,
    space = 8 + Hunter::INIT_SPACE,
    payer = signer,
    seeds = [b"hunter".as_ref(), hunter_mint.key().as_ref()],
    bump
  )]
  pub hunter: Account<'info, Hunter>,
  
  #[account(
    init_if_needed,
    payer = signer,
    associated_token::mint = hunter_mint,
    associated_token::authority = signer
  )]
  pub associated_token_account: Account<'info, TokenAccount>,

  #[account(
    mut,
    address = MetadataAccount::find_pda(&hunter_mint.key()).0,
  )]
  /// CHECK: This is safe as it's just a PDA used for signing
  pub metadata_account: AccountInfo<'info>,

  #[account(
    mut,
    address = MasterEdition::find_pda(&hunter_mint.key()).0,
  )]
  /// CHECK: This is safe as it's just a PDA used for signing
  pub master_edition_account: AccountInfo<'info>,

  pub token_program: Program<'info, Token>,
  pub associated_token_program: Program<'info, AssociatedToken>,
  pub token_metadata_program: Program<'info, Metadata>,
  pub system_program: Program<'info, System>,
  pub rent: Sysvar<'info, Rent>,
}

#[account]
#[derive(InitSpace)]
pub struct Hunter {
    pub token_id: u64,
    pub hunt_rate: u64, // 100 ~ 200
}

// #[derive(Accounts)]
// pub struct SetUserBalance<'info> {
//     #[account(mut)]
//     pub user: Signer<'info>,
    
//     #[account(
//       init_if_needed,
//       space = 8 + UserBalance::INIT_SPACE,
//       payer = user,
//       seeds = [b"user_balance".as_ref(), user.key().as_ref()],
//       bump
//     )]
//     pub user_balance: Account<'info, UserBalance>,
//     pub system_program: Program<'info, System>,
// }




// #[derive(Accounts)]
// #[instruction(user: Pubkey, hunter_id: u64)]
// pub struct Hunt<'info> {
//     #[account(mut)]
//     pub payer: Signer<'info>,

//     #[account(
//         mut,
//         associated_token::mint = hunter_mint,
//         associated_token::authority = payer,
//         constraint = hunter_mint_token_account.owner == payer.key(),
//         constraint = hunter_mint_token_account.mint == hunter_mint.key(),
//         constraint = hunter_mint_token_account.amount >= 1
//     )]
//     pub hunter_token_account: Account<'info, TokenAccount>,


//     #[account(
//         mut,
//         payer = payer,
//         mint::decimals = 0,
//         mint::authority = signer.key(),
//         mint::freeze_authority = signer.key()
//     )]
//     pub hunter_mint: Account<'info, Mint>,

//     #[account(
//       mut,
//       seeds = [b"hunter".as_ref(), hunter_id.to_le_bytes().as_ref()],
//       bump
//     )]
//     pub hunter_attributes: Account<'info, HunterAttributes>,

//     #[account(
//       mut,
//       seeds = [b"user_balance".as_ref(), user.key().as_ref()],
//       bump
//     )]
//     pub user_balance: Account<'info, UserBalance>,

//     #[account(
//       init_if_needed,
//       space = 8 + UserBalance::INIT_SPACE,
//       payer = hunter,
//       seeds = [b"user_balance".as_ref(), hunter.key().as_ref()],
//       bump
//     )]
//     pub hunter_balance: Account<'info, UserBalance>,

//     pub token_program: Program<'info, Token>,
//     pub associated_token_program: Program<'info, AssociatedToken>,
//     pub system_program: Program<'info, System>,
// }

#[account]
#[derive(InitSpace)]
pub struct GameState {
    pub game_initialized: bool,
    pub authority: Pubkey,
    pub hunter_collection_mint: Pubkey,
    pub hunters_minted: u64,
    pub lp_initialized: bool,
    pub bear_mint: Pubkey,
    pub lp_sol_balance: u64,
    pub lp_bear_balance: u64,
}

#[account]
#[derive(InitSpace)]
pub struct UserBalance {
    pub user: Pubkey,
    pub free: u64,
    pub staked: u64,
}

// #[account]
// #[derive(InitSpace)]
// pub struct Curve {
//     pub sol_balance: u64,
//     pub bear_balance: u64,
// }

#[error_code]
pub enum ErrorCode {
    #[msg("Game state already initialized")]
    GameAlreadyInitialized, 

    #[msg("No permission to access this account")]
    NoPermission,

    #[msg("Insufficient balance")]
    InsufficientBalance,
}