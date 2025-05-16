#![allow(clippy::result_large_err)]
use anchor_lang::solana_program::system_instruction;
use anchor_lang::solana_program::program::invoke;
use anchor_lang::solana_program::program::invoke_signed;
use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};


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

declare_id!("4td2N7STVV1zEyrPBbf6bEhq5LW7GkTT7kpNwt762nMW");

const ADMIN_PUBKEY: Pubkey = pubkey!("56LCisjxabaqa2zou4KSjxrPVudEXy7McqPEzx5GvfaS");

const LAMPORTS_PER_SOL: u64 = 1_000_000_000;
const DAY: u64 = 24 * 60 * 60 * 1000;

#[program]
pub mod hunting_game {
  use super::*;

  pub fn initialize(ctx: Context<InitializeGameState>) -> Result<()> {
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

    let seeds: &[&[u8]] = &[b"game_vault", &[ctx.bumps.game_vault]];

    // create game vault pda to support native sol withdraw from
    invoke_signed(
        &system_instruction::create_account(
            &ctx.accounts.admin.key(),
            &ctx.accounts.game_vault.key(),
            ctx.accounts.rent.minimum_balance(0), // space = 0
            0,
            &ctx.accounts.system_program.key(),
        ),
        &[
            ctx.accounts.admin.to_account_info(),
            ctx.accounts.game_vault.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
        &[&seeds],
    )?;

    // let cpi_context = CpiContext::new(
    //   ctx.accounts.token_metadata_program.to_account_info(),
    //   CreateMetadataAccountsV3 {
    //       metadata: ctx.accounts.metadata_account.to_account_info(),
    //       mint: ctx.accounts.hunter_collection_mint.to_account_info(),
    //       mint_authority: ctx.accounts.admin.to_account_info(),
    //       update_authority: ctx.accounts.admin.to_account_info(),
    //       payer: ctx.accounts.admin.to_account_info(),
    //       system_program: ctx.accounts.system_program.to_account_info(),
    //       rent: ctx.accounts.rent.to_account_info(),
    //   }
    // );

    // let data_v2 = DataV2 {
    //     name: "Hunter".to_string(),
    //     symbol: "Hunter".to_string(),
    //     uri: uri,
    //     seller_fee_basis_points: 0,
    //     creators: None,
    //     collection: None,
    //     uses: None,
    // };

    // create_metadata_accounts_v3(cpi_context, data_v2, false, true, None)?;

    // create master edition account
    // let cpi_context = CpiContext::new(
    //     ctx.accounts.token_metadata_program.to_account_info(),
    //     CreateMasterEditionV3 {
    //         edition: ctx.accounts.master_edition_account.to_account_info(),
    //         mint: ctx.accounts.hunter_collection_mint.to_account_info(),
    //         update_authority: ctx.accounts.admin.to_account_info(),
    //         mint_authority: ctx.accounts.admin.to_account_info(),
    //         payer: ctx.accounts.admin.to_account_info(),
    //         metadata: ctx.accounts.metadata_account.to_account_info(),
    //         token_program: ctx.accounts.token_program.to_account_info(),
    //         system_program: ctx.accounts.system_program.to_account_info(),
    //         rent: ctx.accounts.rent.to_account_info(),
    //     },
    // );

    // create_master_edition_v3(cpi_context, None)?;

    Ok(())
  }


  pub fn mint_hunter(ctx: Context<MintHunter>) -> Result<()> {
    if ctx.accounts.hunter_mint.supply == 1 {
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

    const sol_amount: u64 = LAMPORTS_PER_SOL / 10; // 0.1 SOL per hunter

    let ix = system_instruction::transfer(
      &ctx.accounts.signer.key(),
      &ctx.accounts.game_vault.key(),
      sol_amount, 
    );
    invoke(
      &ix, 
      &[
        ctx.accounts.signer.to_account_info(),
        ctx.accounts.game_vault.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
      ],
    )?;

    ctx.accounts.game_state.hunters_minted = ctx.accounts.game_state.hunters_minted.checked_add(1).unwrap();
    ctx.accounts.game_state.lp_sol_balance = ctx.accounts.game_state.lp_sol_balance.checked_add(sol_amount).unwrap();

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

  pub fn initialize_lp(ctx: Context<InitializeGameState>) -> Result<()> {
    if !ctx.accounts.game_state.lp_initialized {
      return Err(ErrorCode::LpAlreadyInitialized.into());
    }

    if ctx.accounts.game_state.hunters_minted < 1000 {
      return Err(ErrorCode::MintingPhase1NotFinished.into());
    }

    ctx.accounts.game_state.lp_initialized = true;
    ctx.accounts.game_state.lp_bear_balance = 1_000_000_000;

    Ok(())
  }

  pub fn initialize_lp_for_test(ctx: Context<InitializeLpForTest>) -> Result<()> {
    let sol_amount = 100 * LAMPORTS_PER_SOL;

    ctx.accounts.game_state.lp_initialized = true;
    ctx.accounts.game_state.lp_sol_balance = sol_amount;
    ctx.accounts.game_state.lp_bear_balance = 1_000_000_000;

    let ix = system_instruction::transfer(
      &ctx.accounts.admin.key(),
      &ctx.accounts.game_vault.key(),
      sol_amount,
    );
    invoke(  
      &ix, 
      &[
        ctx.accounts.admin.to_account_info(),
        ctx.accounts.game_vault.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
      ],
    )?;
    
    Ok(())
  }

  pub fn buy_bear(ctx: Context<BuyBear>, paid_sol_amount: u64, min_received_bear_amount: u64, stake: bool) -> Result<()> {
    if !ctx.accounts.game_state.lp_initialized {
      return Err(ErrorCode::MintingPhase1NotFinished.into());
    }

    let ix = system_instruction::transfer(
      &ctx.accounts.signer.key(),
      &ctx.accounts.game_vault.key(),
      paid_sol_amount,
    );
    invoke(  
      &ix, 
      &[
        ctx.accounts.signer.to_account_info(),
        ctx.accounts.game_vault.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
      ],
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
    

    ctx.accounts.game_state.lp_sol_balance = ctx.accounts.game_state.lp_sol_balance.checked_add(paid_sol_amount).unwrap();
    ctx.accounts.game_state.lp_bear_balance = ctx.accounts.game_state.lp_bear_balance.checked_sub(received_bear_amount).unwrap();

    Ok(())
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

    let ix = system_instruction::transfer(
      &ctx.accounts.game_vault.key(),
      &ctx.accounts.signer.key(),
      received_sol_amount,
    );

    invoke_signed(
      &ix, 
      &[
        ctx.accounts.game_vault.to_account_info(),
        ctx.accounts.signer.to_account_info()
      ],
      signer_seeds
    )?;

    ctx.accounts.seller_bear_balance.free = ctx.accounts.seller_bear_balance.free.checked_sub(send_bear_amount).unwrap();

    Ok(())
  }

  pub fn hunt(ctx: Context<Hunt>, user: Pubkey, hunter_id: u64) -> Result<()> {

    msg!("Hunting user {} by hunter {}", user, hunter_id);

    let now = Clock::get()?.unix_timestamp as u64;

    if ctx.accounts.hunter.last_hunt_time + DAY > now {
      return Err(ErrorCode::AlreadyHunted.into()); // hunter can only hunt once per day
    }

    if ctx.accounts.hunter.token_id != hunter_id {
      return Err(ErrorCode::NoPermission.into()); // invalid hunter id
    }

    if ctx.accounts.hunter_mint.supply == 0 {
      return Err(ErrorCode::InvalidHunterMint.into()); // no hunter
    }

    if ctx.accounts.associated_token_account.owner != ctx.accounts.signer.key() {
      return Err(ErrorCode::NotHunterOwner.into()); // not hunter owner
    }

    if ctx.accounts.user_bear_balance.user != user {
      return Err(ErrorCode::InvalidBearBalance.into()); // invalid user bear balance
    }

    if ctx.accounts.user_bear_balance.hunted_time + DAY > now {
      return Err(ErrorCode::AlreadyHunted.into()); // already hunted
    }

    let hunted_amount = ctx.accounts.hunter.hunt_rate * 100 + ctx.accounts.hunter.hunt_rate * ctx.accounts.hunter.hunted_count / 100;

    if ctx.accounts.user_bear_balance.free < hunted_amount {
      return Err(ErrorCode::InsufficientBalance.into());
    }
    
    ctx.accounts.user_bear_balance.free = ctx.accounts.user_bear_balance.free.checked_sub(hunted_amount).unwrap(); 

    // 20% of hunted amount to hunter
    ctx.accounts.hunter_bear_balance.free = ctx.accounts.hunter_bear_balance.free.checked_add(hunted_amount * 20 / 100).unwrap();

    ctx.accounts.hunter.last_hunt_time = now;
    ctx.accounts.hunter.hunted_count += 1;

    ctx.accounts.user_bear_balance.hunted_time = now;

    Ok(())
  }


  pub fn stake(ctx: Context<Stake>) -> Result<()> {
    if ctx.accounts.user_bear_balance.free == 0 {
      return Err(ErrorCode::InsufficientBalance.into()); // Not enough free bear
    }
    ctx.accounts.user_bear_balance.staked = ctx.accounts.user_bear_balance.staked.checked_add(ctx.accounts.user_bear_balance.free).unwrap();
    ctx.accounts.user_bear_balance.free = 0;

    Ok(())
  }

  pub fn request_unstake(ctx: Context<RequestUnstake>) -> Result<()> {
    if ctx.accounts.user_bear_balance.staked == 0 {
      return Err(ErrorCode::InsufficientStakedBalance.into()); // Not staked
    }
    ctx.accounts.user_bear_balance.request_unstake_time = Clock::get()?.unix_timestamp as u64;

    Ok(())
  }

  pub fn unstake(ctx: Context<Unstake>) -> Result<()> {
   
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

    let ix = system_instruction::transfer(
      &ctx.accounts.signer.key(),
      &ctx.accounts.game_vault.key(),
      sol_amount,
    );
    invoke(
      &ix, 
      &[
        ctx.accounts.signer.to_account_info(),
        ctx.accounts.game_vault.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
      ]
    )?;
    ctx.accounts.user_bear_balance.staked_time = 0;
    ctx.accounts.user_bear_balance.request_unstake_time = 0;

    ctx.accounts.user_bear_balance.free = ctx.accounts.user_bear_balance.free.checked_add(ctx.accounts.user_bear_balance.staked).unwrap();
    ctx.accounts.user_bear_balance.staked = 0;
    Ok(())
  }

  pub fn breed(ctx: Context<Breed>) -> Result<()> { 
    
    if ctx.accounts.user_bear_balance.free == 0 {
      return Err(ErrorCode::InsufficientBalance.into()); // Not enough free bear
    }
    let now = Clock::get()?.unix_timestamp as u64;

    if ctx.accounts.user_bear_balance.breed_time == 0 {
      ctx.accounts.user_bear_balance.breed_time = now;
    }

    if ctx.accounts.user_bear_balance.breed_time + DAY < now {
      return Err(ErrorCode::BreedAfter24Hours.into()); // breed after 24 hours
    }

    ctx.accounts.user_bear_balance.free = ctx.accounts.user_bear_balance.free.checked_add(ctx.accounts.user_bear_balance.free.checked_div(100).unwrap()).unwrap();
    ctx.accounts.user_bear_balance.breed_time = now;
  }

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
    mut,
    seeds=[b"game_vault"],
    bump
  )]
  /// CHECK: This is safe as it's just a PDA used as sol vault
  game_vault: AccountInfo<'info>,

  #[account(
    init_if_needed,
    payer = admin,
    mint::authority = bear_mint,
    mint::decimals = 9,
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

  // #[account(
  //   mut,
  //   address = MetadataAccount::find_pda(&hunter_collection_mint.key()).0
  // )]
  // /// CHECK: This is safe as it's just a PDA used for signing
  // pub metadata_account: AccountInfo<'info>,

  // #[account(
  //   mut,
  //   address = MasterEdition::find_pda(&hunter_collection_mint.key()).0
  // )]
  // /// CHECK: This is safe as it's just a PDA used for signing
  // pub master_edition_account: AccountInfo<'info>,

  pub system_program: Program<'info, System>,
  pub token_program: Program<'info, Token>,
  pub associated_token_program: Program<'info, AssociatedToken>,
  pub rent: Sysvar<'info, Rent>,
}

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
  game_vault: AccountInfo<'info>,


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
  pub associated_token_account: Account<'info, TokenAccount>,

  #[account(
    init_if_needed,
    space = 8 + Hunter::INIT_SPACE,
    payer = signer,
    seeds = [b"hunter".as_ref(), hunter_mint.key().as_ref()],
    bump
  )]
  pub hunter: Account<'info, Hunter>,


  // #[account(
  //   mut,
  //   address = MetadataAccount::find_pda(&hunter_mint.key()).0,
  // )]
  // /// CHECK: This is safe as it's just a PDA used for signing
  // pub metadata_account: AccountInfo<'info>,

  // #[account(
  //   mut,
  //   address = MasterEdition::find_pda(&hunter_mint.key()).0,
  // )]
  // /// CHECK: This is safe as it's just a PDA used for signing
  // pub master_edition_account: AccountInfo<'info>,

  pub token_program: Program<'info, Token>,
  pub associated_token_program: Program<'info, AssociatedToken>,
  // pub token_metadata_program: Program<'info, Metadata>,
  pub system_program: Program<'info, System>,
  pub rent: Sysvar<'info, Rent>,
}

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
  /// CHECK: This is safe as it's just a PDA used as vault
  game_vault: AccountInfo<'info>,

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
  pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct InitializeLpForTest<'info> {
  #[account(
    mut,
    address = ADMIN_PUBKEY
  )]
  pub admin: Signer<'info>,

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

  pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeLp<'info> {
  #[account(
    mut,
    address = ADMIN_PUBKEY
  )]
  pub admin: Signer<'info>,

  #[account(  
    mut,
    seeds = [b"game_state"],
    bump
  )]
  pub game_state: Account<'info, GameState>,

  pub system_program: Program<'info, System>,
}


#[derive(Accounts)]
#[instruction(user: Pubkey, hunter_id: u64)]
pub struct Hunt<'info> {
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
        seeds = [b"hunter_mint".as_ref(), hunter_id.to_le_bytes().as_ref()],
        bump
    )]
    pub hunter_mint: Account<'info, Mint>, // Hunter NFT

    #[account(
      mut,
      constraint = associated_token_account.owner == signer.key(),
      constraint = associated_token_account.mint == hunter_mint.key()
    )]
    pub associated_token_account: Account<'info, TokenAccount>, // Hunter NFT token account


    #[account(
      mut,
      seeds = [b"hunter".as_ref(), hunter_mint.key().as_ref()],
      bump
    )]
    pub hunter: Account<'info, Hunter>,

    #[account(
      mut,
      seeds = [b"user_bear_balance".as_ref(), user.key().as_ref()],
      bump
    )]
    pub user_bear_balance: Account<'info, UserBearBalance>,

    #[account(
      init_if_needed,
      space = 8 + UserBearBalance::INIT_SPACE,
      payer = signer,
      seeds = [b"user_bear_balance".as_ref(), signer.key().as_ref()],
      bump
    )]
    pub hunter_bear_balance: Account<'info, UserBearBalance>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}


#[derive(Accounts)]
pub struct Stake<'info> {
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
pub struct RequestUnstake<'info> {
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
pub struct Unstake<'info> {
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

#[derive(Accounts)]
pub struct Breed<'info> {
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
pub struct Hunter {
    pub token_id: u64,
    pub hunt_rate: u64, // [100, 200)
    pub last_hunt_time: u64,
    pub hunted_count: u64,
}

#[account]
#[derive(InitSpace)]
pub struct UserBearBalance {
    pub user: Pubkey,
    pub free: u64,
    pub staked: u64,
    pub hunted_time: u64,
    pub staked_time: u64,
    pub request_unstake_time: u64,
    pub breed_time: u64
}


#[error_code]
pub enum ErrorCode {
    #[msg("Game state already initialized")]
    GameAlreadyInitialized, 

    #[msg("Liquidity pool is already initialized")]
    LpAlreadyInitialized, 

    #[msg("Minting phase 1 is not finished")]
    MintingPhase1NotFinished, 

    #[msg("No permission to access this account")]
    NoPermission,

    #[msg("Invaid hunter mint")]
    InvalidHunterMint,

    #[msg("Not hunter owner")]
    NotHunterOwner,

    #[msg("Invalid bear balance")]
    InvalidBearBalance,

    #[msg("Insufficient balance")]
    InsufficientBalance,

     #[msg("Insufficient staked balance")]
    InsufficientStakedBalance,

    #[msg("hunter can only hunt once per 24 hours")]
    AlreadyHunted,

    #[msg("Breed after 24 hours")]
    BreedAfter24Hours,
}