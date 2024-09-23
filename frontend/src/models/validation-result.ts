export type ValidationResult = {
    focusNode: string;
    path: string;
    message: string;
    severity: Severity;
    sourceConstraintComponent: string;
    value?: string;
};

export type Severity = 'Violation' | 'Warning' | 'Info';

/**
 * Maps the value of a RDF node regarding severity of validation mismatch.
 *
 * @param raw The value of the RDF node
 * @returns 'Violation' | 'Warning' | 'Info'
 */
export const mapSeverity = (raw?: string): Severity => {
    switch (raw) {
        case 'http://www.w3.org/ns/shacl#Violation':
            return 'Violation';
        case 'http://www.w3.org/ns/shacl#Warning':
            return 'Warning';
        case 'http://www.w3.org/ns/shacl#Info':
            return 'Info';
        default:
            throw new Error(
                `Unknown severity encountered during validation report processing ${raw}`
            );
    }
};
