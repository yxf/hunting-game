
use uint::construct_uint;
// construct_uint! {
//     pub struct U128(2);
// }

construct_uint! {
    pub struct U256(4);
}

#[derive(Clone, Debug, Default, PartialEq)]
pub struct Curve;

impl Curve {

    pub const EXPONENT: u8 = 4; 

    pub fn k(
        x: u128,
        y: u128
    ) -> U256 {
        // k = x^4 * y
        let x = U256::from(x);
        let y = U256::from(y);
        x.pow(Self::EXPONENT.into()).checked_mul(y).unwrap()
    }

    pub fn price(
        x: u128,
        y: u128
    ) -> u128 {
        // price = 4y / x
        let x = U256::from(x);
        let y = U256::from(y);
        y.checked_mul(Self::EXPONENT.into()).unwrap().checked_div(x).unwrap().as_u128()
    }

    pub fn exact_x_input(
        x_amount: u128,
        x: u128,
        y: u128
    ) -> u128 {
        // Constant product swap ensures x^4 * y = constant
        // (x + x_amount)^4 * (y - y_amount) = x^4 * y
        // y_amount = y - x^4 * y / (x + x_amount)^4
        let x_amount = U256::from(x_amount);
        let x = U256::from(x);
        let y = U256::from(y);

        let numerator = x.pow(Self::EXPONENT.into()).checked_mul(y).unwrap();
        let denominator = x.checked_add(x_amount).unwrap().pow(Self::EXPONENT.into());
        let (mut right, rem) = numerator.div_mod(denominator);
        if rem > U256::zero() {
            right = right.checked_add(1u128.into()).unwrap();
        }

        let y_amount = y.checked_sub(right).unwrap();
        y_amount.as_u128()
    }

    pub fn exact_y_input(
        y_amount: u128,
        x: u128,
        y: u128
    ) -> u128 {
        // Constant product swap ensures x^4 * y = constant
        // (x - x_amount)^4 * (y + y_amount) = x^4 * y
        // x_amount = x - [x^4 * y / (y + y_amount)]^0.25
        let y_amount = U256::from(y_amount);
        let x = U256::from(x);
        let y = U256::from(y);

        let numerator = x.pow(Self::EXPONENT.into()).checked_mul(y).unwrap();
        let denominator = y.checked_add(y_amount).unwrap();
        let right = numerator.checked_div(denominator).unwrap().integer_sqrt().integer_sqrt();
        let y_amount = x.checked_sub(right.checked_add(1.into()).unwrap()).unwrap();
        y_amount.as_u128()
    }
}


#[cfg(test)]
pub mod tests {
    use super::*;
    use crate::constants::*;

    #[test]
    fn test_exact_y_input() {
        let y_amount = LAMPORTS_PER_SOL as u128; // 1 SOL
        let x = 1000000000u128;
        let y = 100 * LAMPORTS_PER_SOL as u128;

        // x_amount = x - [x^4 * y / (y + y_amount)]^0.25
        let x_amount = Curve::exact_y_input(y_amount, x, y);
        assert_eq!(x_amount, 2484491);
        
        let constant_before = Curve::k(x, y);
        // let constant_after = U256::from(x - x_amount).pow(Curve::EXPONENT.into()).checked_mul(U256::from(y + y_amount)).unwrap();
        let constant_after = Curve::k(x - x_amount, y + y_amount);
        println!("constant_before: {}, constant_after: {}", constant_before, constant_after);
        assert!(constant_after > constant_before);
    }

    #[test]
    fn test_exact_x_input() {
        let x_amount = 1000000 as u128;
        let x = 1000000000u128;
        let y = 100 * LAMPORTS_PER_SOL as u128;

        // y_amount = y - x^4 * y / (x + x_amount)^4
        let y_amount = Curve::exact_x_input(x_amount, x, y);
        assert_eq!(y_amount, 399001996);

        let constant_before = Curve::k(x, y);
        let constant_after = Curve::k(x + x_amount, y - y_amount);
        assert!(constant_after >= constant_before);

    }
}