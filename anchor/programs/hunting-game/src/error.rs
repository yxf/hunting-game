use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid owner")]
    InvalidOwner,

    #[msg("Game state already initialized")]
    GameAlreadyInitialized, 

    #[msg("Liquidity pool is already initialized")]
    LpAlreadyInitialized, 

    #[msg("This hunter is already minted")]
    HunterAlreadyMinted, 

    #[msg("Minting phase 1 is finished")]
    MintingPhase1Finished, 

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