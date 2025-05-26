use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid owner")]
    InvalidOwner,

    #[msg("Game state already initialized")]
    GameAlreadyInitialized, 

    #[msg("Bear liquidity pool is already initialized")]
    BearPoolAlreadyInitialized, 

    #[msg("This hunter is already minted")]
    HunterAlreadyMinted, 

    #[msg("Minting phase 1 is ended")]
    MintingPhase1Ended, 

    #[msg("Minting phase 1 is not ended")]
    MintingPhase1NotEnded, 

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

    #[msg("Insufficient output amount")]
    InsufficientOutputAmount,

     #[msg("Insufficient staked balance")]
    InsufficientStakedBalance,

    #[msg("hunter can only hunt once per 24 hours")]
    AlreadyHunted,

    #[msg("Breed after 24 hours")]
    BreedAfter24Hours,

    #[msg("Exit island is not allowed")]
    ExitIslandNotAllowed,
}