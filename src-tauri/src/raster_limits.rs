//! One cell ceiling regardless of provider, resolution, or local/remote origin.
use super::{NativeError, Value};
pub(crate) const MAX_CELLS: usize = 8192 * 8292;
pub(crate) fn check(metadata: &Value) -> Result<(), NativeError> {
    let width = metadata["size"][0].as_u64().unwrap_or(0);
    let height = metadata["size"][1].as_u64().unwrap_or(0);
    if width == 0
        || height == 0
        || width
            .checked_mul(height)
            .is_none_or(|cells| cells > MAX_CELLS as u64)
    {
        return Err(NativeError::Gdal("El modelo supera el límite de 67.928.064 celdas. Reduzca el área sin cambiar la resolución.".into()));
    }
    Ok(())
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn common_limit_checks_total_cells_and_overflow() {
        for (width, height, valid) in [
            (8192, 8292, true),
            (8292, 8192, true),
            (16000, 4000, true),
            (8192, 8293, false),
            (0, 100, false),
            (u64::MAX, 2, false),
        ] {
            assert_eq!(
                check(&serde_json::json!({"size":[width,height]})).is_ok(),
                valid
            );
        }
    }
}
