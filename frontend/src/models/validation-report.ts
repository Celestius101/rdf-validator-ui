import { ValidationResult } from './validation-result';

export type ValidationReport = {
    conforms: boolean;
    results: ValidationResult[];
};
