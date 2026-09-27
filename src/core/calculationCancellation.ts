export const CALCULATION_CANCELLED='Cálculo cancelado';
export function isCalculationCancelled(error:unknown){return String(error instanceof Error?error.message:error).includes(CALCULATION_CANCELLED)}
