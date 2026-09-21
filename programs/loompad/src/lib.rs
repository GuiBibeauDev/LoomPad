#![deny(unsafe_code)]
// Anchor 0.31 generates AccountInfo::realloc calls, including helper modules
// outside the annotated program module. Remove this when Anchor replaces them.
#![allow(deprecated)]

use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWxTWqkZpY3vL8z2J6cXuvfGQ9rv");

const BPS_DENOMINATOR: u64 = 10_000;
const MAX_FEE_BPS: u16 = 1_000;
const MAX_RECIPIENTS: usize = 8;
const MAX_NAME_LEN: usize = 32;
const MAX_SYMBOL_LEN: usize = 10;
const MAX_URI_LEN: usize = 200;

#[program]
pub mod loompad {
    use super::*;

    pub fn initialize_launch(
        ctx: Context<InitializeLaunch>,
        args: InitializeLaunchArgs,
    ) -> Result<()> {
        args.validate()?;
        let launch = &mut ctx.accounts.launch;
        launch.version = 1;
        launch.bump = ctx.bumps.launch;
        launch.creator = ctx.accounts.creator.key();
        launch.mint = ctx.accounts.mint.key();
        launch.created_at = Clock::get()?.unix_timestamp;
        launch.name = args.name;
        launch.symbol = args.symbol;
        launch.metadata_uri = args.metadata_uri;
        launch.total_supply = args.total_supply;
        launch.creator_allocation = args.creator_allocation;
        launch.virtual_token_reserve = args.virtual_token_reserve;
        launch.virtual_quote_reserve = args.virtual_quote_reserve;
        launch.token_reserve = args
            .total_supply
            .checked_sub(args.creator_allocation)
            .ok_or(LaunchError::ArithmeticOverflow)?;
        launch.quote_reserve = 0;
        launch.tokens_sold = 0;
        launch.trade_fee_bps = args.trade_fee_bps;
        launch.fee_recipients = args.fee_recipients;
        launch.vesting_start = args.vesting_start;
        launch.vesting_cliff_seconds = args.vesting_cliff_seconds;
        launch.vesting_duration_seconds = args.vesting_duration_seconds;
        launch.graduation_threshold = args.graduation_threshold;
        launch.graduation_adapter = args.graduation_adapter;
        launch.graduated = false;
        launch.configuration_mutable = false;

        emit!(LaunchCreated {
            launch: launch.key(),
            mint: launch.mint,
            creator: launch.creator,
        });
        Ok(())
    }

    pub fn record_buy(
        ctx: Context<RecordTrade>,
        quote_amount: u64,
        minimum_tokens_out: u64,
    ) -> Result<()> {
        require!(quote_amount > 0, LaunchError::ZeroAmount);
        let launch = &mut ctx.accounts.launch;
        require!(!launch.graduated, LaunchError::AlreadyGraduated);

        let fee = quote_amount
            .checked_mul(u64::from(launch.trade_fee_bps))
            .ok_or(LaunchError::ArithmeticOverflow)?
            .checked_add(BPS_DENOMINATOR - 1)
            .ok_or(LaunchError::ArithmeticOverflow)?
            .checked_div(BPS_DENOMINATOR)
            .ok_or(LaunchError::ArithmeticOverflow)?;
        let net_quote = quote_amount
            .checked_sub(fee)
            .ok_or(LaunchError::ArithmeticOverflow)?;
        let token_reserve = launch
            .virtual_token_reserve
            .checked_add(launch.token_reserve)
            .ok_or(LaunchError::ArithmeticOverflow)?;
        let quote_reserve = launch
            .virtual_quote_reserve
            .checked_add(launch.quote_reserve)
            .ok_or(LaunchError::ArithmeticOverflow)?;
        let invariant = u128::from(token_reserve)
            .checked_mul(u128::from(quote_reserve))
            .ok_or(LaunchError::ArithmeticOverflow)?;
        let next_quote = quote_reserve
            .checked_add(net_quote)
            .ok_or(LaunchError::ArithmeticOverflow)?;
        let next_token_u128 = invariant
            .checked_div(u128::from(next_quote))
            .ok_or(LaunchError::ArithmeticOverflow)?;
        let next_token =
            u64::try_from(next_token_u128).map_err(|_| LaunchError::ArithmeticOverflow)?;
        let tokens_out = token_reserve
            .checked_sub(next_token)
            .ok_or(LaunchError::ArithmeticOverflow)?;
        require!(
            tokens_out > 0 && tokens_out <= launch.token_reserve,
            LaunchError::InsufficientLiquidity
        );
        require!(
            tokens_out >= minimum_tokens_out,
            LaunchError::SlippageExceeded
        );

        launch.token_reserve = launch
            .token_reserve
            .checked_sub(tokens_out)
            .ok_or(LaunchError::ArithmeticOverflow)?;
        launch.quote_reserve = launch
            .quote_reserve
            .checked_add(net_quote)
            .ok_or(LaunchError::ArithmeticOverflow)?;
        launch.tokens_sold = launch
            .tokens_sold
            .checked_add(tokens_out)
            .ok_or(LaunchError::ArithmeticOverflow)?;

        emit!(TradeRecorded {
            launch: launch.key(),
            trader: ctx.accounts.trader.key(),
            side: TradeSide::Buy,
            amount_in: quote_amount,
            amount_out: tokens_out,
            fee,
        });
        Ok(())
    }

    pub fn mark_graduated(ctx: Context<Graduate>) -> Result<()> {
        let launch = &mut ctx.accounts.launch;
        require!(!launch.graduated, LaunchError::AlreadyGraduated);
        require!(
            launch.quote_reserve >= launch.graduation_threshold,
            LaunchError::GraduationNotReady
        );
        launch.graduated = true;
        emit!(LaunchGraduated {
            launch: launch.key(),
            adapter: launch.graduation_adapter,
        });
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(args: InitializeLaunchArgs)]
pub struct InitializeLaunch<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    /// CHECK: The mint program and supply are verified by clients and the token program. It is only stored as an address here.
    pub mint: UncheckedAccount<'info>,
    #[account(
        init,
        payer = creator,
        space = 8 + Launch::INIT_SPACE,
        seeds = [b"launch", mint.key().as_ref()],
        bump
    )]
    pub launch: Account<'info, Launch>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RecordTrade<'info> {
    pub trader: Signer<'info>,
    #[account(mut, seeds = [b"launch", launch.mint.as_ref()], bump = launch.bump)]
    pub launch: Account<'info, Launch>,
}

#[derive(Accounts)]
pub struct Graduate<'info> {
    pub caller: Signer<'info>,
    #[account(mut, seeds = [b"launch", launch.mint.as_ref()], bump = launch.bump)]
    pub launch: Account<'info, Launch>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct InitializeLaunchArgs {
    #[max_len(32)]
    pub name: String,
    #[max_len(10)]
    pub symbol: String,
    #[max_len(200)]
    pub metadata_uri: String,
    pub total_supply: u64,
    pub creator_allocation: u64,
    pub virtual_token_reserve: u64,
    pub virtual_quote_reserve: u64,
    pub trade_fee_bps: u16,
    #[max_len(8)]
    pub fee_recipients: Vec<FeeRecipient>,
    pub vesting_start: i64,
    pub vesting_cliff_seconds: u64,
    pub vesting_duration_seconds: u64,
    pub graduation_threshold: u64,
    pub graduation_adapter: Pubkey,
}

impl InitializeLaunchArgs {
    fn validate(&self) -> Result<()> {
        require!(
            !self.name.is_empty() && self.name.len() <= MAX_NAME_LEN,
            LaunchError::InvalidMetadata
        );
        require!(
            !self.symbol.is_empty()
                && self.symbol.len() <= MAX_SYMBOL_LEN
                && self
                    .symbol
                    .bytes()
                    .all(|b| b.is_ascii_uppercase() || b.is_ascii_digit()),
            LaunchError::InvalidMetadata
        );
        require!(
            self.metadata_uri.starts_with("https://") && self.metadata_uri.len() <= MAX_URI_LEN,
            LaunchError::InvalidMetadata
        );
        require!(
            self.total_supply > 0 && self.creator_allocation <= self.total_supply,
            LaunchError::InvalidSupply
        );
        require!(
            self.virtual_token_reserve > 0 && self.virtual_quote_reserve > 0,
            LaunchError::InvalidCurve
        );
        require!(self.trade_fee_bps <= MAX_FEE_BPS, LaunchError::InvalidFees);
        require!(
            !self.fee_recipients.is_empty() && self.fee_recipients.len() <= MAX_RECIPIENTS,
            LaunchError::InvalidFees
        );
        let mut total_bps: u64 = 0;
        for (index, recipient) in self.fee_recipients.iter().enumerate() {
            require!(recipient.basis_points > 0, LaunchError::InvalidFees);
            require!(
                !self.fee_recipients[..index]
                    .iter()
                    .any(|prior| prior.address == recipient.address),
                LaunchError::DuplicateFeeRecipient
            );
            total_bps = total_bps
                .checked_add(u64::from(recipient.basis_points))
                .ok_or(LaunchError::ArithmeticOverflow)?;
        }
        require!(total_bps == BPS_DENOMINATOR, LaunchError::InvalidFees);
        require!(
            (self.creator_allocation == 0 && self.vesting_duration_seconds == 0)
                || (self.creator_allocation > 0
                    && self.vesting_duration_seconds > 0
                    && self.vesting_cliff_seconds <= self.vesting_duration_seconds),
            LaunchError::InvalidVesting
        );
        require!(
            self.graduation_threshold > 0 && self.graduation_adapter != Pubkey::default(),
            LaunchError::InvalidGraduation
        );
        Ok(())
    }
}

#[account]
#[derive(InitSpace)]
pub struct Launch {
    pub version: u8,
    pub bump: u8,
    pub creator: Pubkey,
    pub mint: Pubkey,
    pub created_at: i64,
    #[max_len(32)]
    pub name: String,
    #[max_len(10)]
    pub symbol: String,
    #[max_len(200)]
    pub metadata_uri: String,
    pub total_supply: u64,
    pub creator_allocation: u64,
    pub virtual_token_reserve: u64,
    pub virtual_quote_reserve: u64,
    pub token_reserve: u64,
    pub quote_reserve: u64,
    pub tokens_sold: u64,
    pub trade_fee_bps: u16,
    #[max_len(8)]
    pub fee_recipients: Vec<FeeRecipient>,
    pub vesting_start: i64,
    pub vesting_cliff_seconds: u64,
    pub vesting_duration_seconds: u64,
    pub graduation_threshold: u64,
    pub graduation_adapter: Pubkey,
    pub graduated: bool,
    pub configuration_mutable: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct FeeRecipient {
    pub address: Pubkey,
    pub basis_points: u16,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub enum TradeSide {
    Buy,
    Sell,
}

#[event]
pub struct LaunchCreated {
    pub launch: Pubkey,
    pub mint: Pubkey,
    pub creator: Pubkey,
}
#[event]
pub struct TradeRecorded {
    pub launch: Pubkey,
    pub trader: Pubkey,
    pub side: TradeSide,
    pub amount_in: u64,
    pub amount_out: u64,
    pub fee: u64,
}
#[event]
pub struct LaunchGraduated {
    pub launch: Pubkey,
    pub adapter: Pubkey,
}

#[error_code]
pub enum LaunchError {
    #[msg("Metadata is invalid")]
    InvalidMetadata,
    #[msg("Supply is invalid")]
    InvalidSupply,
    #[msg("Curve parameters are invalid")]
    InvalidCurve,
    #[msg("Fee routing is invalid")]
    InvalidFees,
    #[msg("Fee recipients must be unique")]
    DuplicateFeeRecipient,
    #[msg("Vesting configuration is invalid")]
    InvalidVesting,
    #[msg("Graduation configuration is invalid")]
    InvalidGraduation,
    #[msg("Arithmetic operation overflowed")]
    ArithmeticOverflow,
    #[msg("Amount must be greater than zero")]
    ZeroAmount,
    #[msg("Available liquidity is insufficient")]
    InsufficientLiquidity,
    #[msg("Minimum output was not met")]
    SlippageExceeded,
    #[msg("Launch has already graduated")]
    AlreadyGraduated,
    #[msg("Graduation threshold has not been reached")]
    GraduationNotReady,
}
