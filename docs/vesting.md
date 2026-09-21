# Creator vesting

A non-zero creator allocation requires vesting. Version 1 uses a start timestamp, cliff, duration, and linear unlock. Nothing is vested before the cliff; after it, the amount is `allocation × elapsed / duration`, rounded down; at or after the end, the full allocation is vested.

Future claim settlement must store claimed amount, calculate `vested - claimed` with checked arithmetic, bind the beneficiary to the immutable creator, and transfer only from the dedicated vesting vault. Closing or reallocating that vault before full vesting must be impossible.
