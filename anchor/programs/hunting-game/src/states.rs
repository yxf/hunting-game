use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct GameState {
    pub game_initialized: bool,
    pub hunter_collection_mint: Pubkey,
    pub hunters_minted: u64,
    pub lp_initialized: bool,
    pub total_supply: u64, // total bear supply
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