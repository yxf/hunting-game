use anchor_lang::prelude::*;
use anchor_spl::token::{ mint_to, Mint, MintTo, Token, TokenAccount};
use anchor_spl::associated_token::AssociatedToken;

use anchor_spl::metadata::Metadata;
use mpl_token_metadata::accounts::{ MasterEdition, Metadata as MetadataAccount };

use crate::states::*;
use crate::error::ErrorCode;
use crate::constants::*;
use crate::utils;


#[derive(Accounts)]
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
    seeds=[b"game_vault"],
    bump
  )]
  /// CHECK: This is safe as it's just a PDA used as vault
  pub game_vault: AccountInfo<'info>,


  #[account(
    init_if_needed,
    payer = signer,
    mint::decimals = 0,
    mint::authority = hunter_mint,
    seeds = [b"hunter_mint".as_ref(), game_state.hunters_minted.checked_add(1).unwrap().to_le_bytes().as_ref()],
    bump
  )]
  pub hunter_mint: Account<'info, Mint>, // Hunter NFT

  #[account(
    init_if_needed,
    payer = signer,
    associated_token::mint = hunter_mint,
    associated_token::authority = signer
  )]
  pub hunter_mint_token_account: Account<'info, TokenAccount>,

  #[account(
    init_if_needed,
    space = 8 + Hunter::INIT_SPACE,
    payer = signer,
    seeds = [b"hunter".as_ref(), hunter_mint.key().as_ref()],
    bump
  )]
  pub hunter: Account<'info, Hunter>,

  #[cfg(not(feature = "localnet"))]
  #[account(
    mut,
    address = MetadataAccount::find_pda(&hunter_mint.key()).0,
  )]
  /// CHECK: This is safe as it's just a PDA used for metadata
  pub metadata_account: AccountInfo<'info>,

  #[cfg(not(feature = "localnet"))]
  #[account(
    mut,
    address = MasterEdition::find_pda(&hunter_mint.key()).0,
  )]
  /// CHECK: This is safe as it's just a PDA used for metadata
  pub master_edition_account: AccountInfo<'info>,

  #[cfg(not(feature = "localnet"))]
  pub token_metadata_program: Program<'info, Metadata>,

  pub token_program: Program<'info, Token>,
  pub associated_token_program: Program<'info, AssociatedToken>,
  pub system_program: Program<'info, System>,
  pub rent: Sysvar<'info, Rent>,
}

pub fn mint_hunter(ctx: Context<MintHunter>) -> Result<()> {

    require!(ctx.accounts.hunter_mint.supply == 0, ErrorCode::HunterAlreadyMinted);
    require!(ctx.accounts.game_state.hunters_minted < 1000, ErrorCode::MintingPhase1Ended);

    // if ctx.accounts.hunter_mint.supply == 1 {
    //     return Err(ErrorCode::HunterAlreadyMinted.into());
    // }

    // if ctx.accounts.game_state.hunters_minted >= 1000 {
    //     return Err(ErrorCode::MintingPhase1Ended.into());
    // }

    // if ctx.accounts.game_state.lp_initialized {
    //     return Err(ErrorCode::MintingPhase1Ended.into());
    // }

    let hunter_id = ctx.accounts.game_state.hunters_minted.checked_add(1).unwrap(); 

    let hunter_id_bytes = hunter_id.to_le_bytes();
    let bump = ctx.bumps.hunter_mint;
    let signer: &[&[&[u8]]] = &[&[b"hunter_mint", hunter_id_bytes.as_ref(), &[bump]]];

    let cpi_context = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        MintTo {
            mint: ctx.accounts.hunter_mint.to_account_info(),
            to: ctx.accounts.hunter_mint_token_account.to_account_info(),
            authority: ctx.accounts.hunter_mint.to_account_info(),
        },
        signer,
    );

    mint_to(cpi_context, 1)?;

    let mint_price: u64 = LAMPORTS_PER_SOL / 10; // 0.1 SOL per hunter

    utils::transfer_sol_from_user_to_vault(
        ctx.accounts.signer.to_account_info(), 
        ctx.accounts.game_vault.to_account_info(), 
        ctx.accounts.system_program.to_account_info(), 
        mint_price
    )?;

    ctx.accounts.game_state.hunters_minted = ctx.accounts.game_state.hunters_minted.checked_add(1).unwrap();
    ctx.accounts.game_state.lp_sol_balance = ctx.accounts.game_state.lp_sol_balance.checked_add(mint_price).unwrap();
    
    // let cpi_context = CpiContext::new(
    //   ctx.accounts.token_metadata_program.to_account_info(),
    //   CreateMetadataAccountsV3 {
    //       metadata: ctx.accounts.metadata_account.to_account_info(),
    //       mint: ctx.accounts.hunter_mint.to_account_info(),
    //       mint_authority: ctx.accounts.authority.to_account_info(),
    //       update_authority: ctx.accounts.authority.to_account_info(),
    //       payer: ctx.accounts.signer.to_account_info(),
    //       system_program: ctx.accounts.system_program.to_account_info(),
    //       rent: ctx.accounts.rent.to_account_info(),
    //   },
    // );

    // let data_v2 = DataV2 {
    //     name: "Hunter".to_string(),
    //     symbol: format!("Hunter #{}", hunter_id),
    //     uri: "uri".to_string(),
    //     seller_fee_basis_points: 0,
    //     creators: None,
    //     collection: Some(Collection {
    //         verified: true,
    //         key: ctx.accounts.game_state.hunter_collection_mint,
    //     }),
    //     uses: None,
    // };

    // create_metadata_accounts_v3(cpi_context, data_v2, false, false, None)?;

    ctx.accounts.hunter.token_id = hunter_id;

    let seed =  Clock::get()?.slot | hunter_id;
    let random_seed = u64::from_le_bytes(
        seed
        .to_le_bytes()[0..8]
        .try_into()
        .unwrap(),
    );
    ctx.accounts.hunter.hunt_rate = 100 + (random_seed % 100);

    #[cfg(not(feature = "localnet"))]
    utils::create_nft_metadata(
        ctx.accounts.token_metadata_program.to_account_info(),
        ctx.accounts.metadata_account.to_account_info(),
        ctx.accounts.master_edition_account.to_account_info(),
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.hunter_mint.to_account_info(),
        ctx.accounts.signer.to_account_info(),
        ctx.accounts.signer.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
        ctx.accounts.rent.to_account_info(),
        Some(ctx.accounts.game_state.hunter_collection_mint),
        format!("Hunter #{}", hunter_id), // name
        "HUNTER".to_string(), // symbol
        "uri".to_string() // uri
    )?;

    Ok(())
}

pub fn mint_hunter2(ctx: Context<MintHunter>) -> Result<()> {
    require!(ctx.accounts.hunter_mint.supply == 0, ErrorCode::HunterAlreadyMinted);

    #[cfg(not(feature = "localnet"))] {
      require!(ctx.accounts.game_state.hunters_minted >= 1000, ErrorCode::MintingPhase1NotEnded);
    }
    

    require!(ctx.accounts.game_state.lp_initialized, ErrorCode::MintingPhase1NotEnded);
    
    let hunter_id = ctx.accounts.game_state.hunters_minted.checked_add(1).unwrap(); 
    
    let hunter_id_bytes = hunter_id.to_le_bytes();
    let bump = ctx.bumps.hunter_mint;
    let signer: &[&[&[u8]]] = &[&[b"hunter_mint", hunter_id_bytes.as_ref(), &[bump]]];

    let cpi_context = CpiContext::new_with_signer(
      ctx.accounts.token_program.to_account_info(),
      MintTo {
          mint: ctx.accounts.hunter_mint.to_account_info(),
          to: ctx.accounts.hunter_mint_token_account.to_account_info(),
          authority: ctx.accounts.hunter_mint.to_account_info(),
      },
      signer,
    );
    mint_to(cpi_context, 1)?;


    let mint_price: u64 = utils::get_hunter_price(ctx.accounts.game_state.total_supply);

    msg!("Minting price: {}", mint_price);

    utils::transfer_sol_from_user_to_vault(
        ctx.accounts.signer.to_account_info(), 
        ctx.accounts.game_vault.to_account_info(), 
        ctx.accounts.system_program.to_account_info(), 
        mint_price
    )?;

    ctx.accounts.game_state.hunters_minted = ctx.accounts.game_state.hunters_minted.checked_add(1).unwrap();
    ctx.accounts.game_state.lp_sol_balance = ctx.accounts.game_state.lp_sol_balance.checked_add(mint_price).unwrap();
    ctx.accounts.hunter.token_id = hunter_id;

    let seed =  Clock::get()?.slot | hunter_id;
    let random_seed = u64::from_le_bytes(
        seed
        .to_le_bytes()[0..8]
        .try_into()
        .unwrap(),
    );
    ctx.accounts.hunter.hunt_rate = 100 + (random_seed % 100);

    #[cfg(not(feature = "localnet"))]
    utils::create_nft_metadata(
        ctx.accounts.token_metadata_program.to_account_info(),
        ctx.accounts.metadata_account.to_account_info(),
        ctx.accounts.master_edition_account.to_account_info(),
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.hunter_mint.to_account_info(),
        ctx.accounts.signer.to_account_info(),
        ctx.accounts.signer.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
        ctx.accounts.rent.to_account_info(),
        Some(ctx.accounts.game_state.hunter_collection_mint),
        format!("Hunter #{}", hunter_id), // name
        "HUNTER".to_string(), // symbol
        "uri".to_string() // uri
    )?;

    Ok(())
}