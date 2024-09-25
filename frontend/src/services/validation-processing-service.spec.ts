import {
    failingDatasetFixture,
    successfulDatasetFixture,
} from '../fixtures/dataset';
import {
    extractValidationReport,
    processValidationResult,
    toPrefixed,
} from './validation-processing-service';

describe('Validation Processing Service', () => {
    describe('toPrefixed', () => {
        it('should return the prefixed version for a known namespace', () => {
            const result = toPrefixed('http://schema.org/name');
            expect(result).toBe('schema:name');
        });

        it('should return the original value when input does not match any prefix', () => {
            const result = toPrefixed('http://no-match.org/resource');
            expect(result).toBe('http://no-match.org/resource');
        });

        it('should return undefined when input is undefined', () => {
            const result = toPrefixed(undefined);
            expect(result).toBeUndefined();
        });
    });

    describe('processValidationResult', () => {
        it('should return a valid dataset for correct turtle string', async () => {
            const dataset = await processValidationResult(
                failingDatasetFixture
            );
            expect(dataset.size).toBeGreaterThan(0);
        });

        it('should reject when turtle string is invalid', async () => {
            const invalidTurtle = `
            @prefix schema: <http://schema.org/> .
            <http://example.org/Person/123> schema:name "John Doe"
        `;

            await expect(
                processValidationResult(invalidTurtle)
            ).rejects.toThrow();
        });
    });

    describe('extractValidationReport', () => {
        it('should extract a valid report from the failing dataset', async () => {
            const dataset = await processValidationResult(
                failingDatasetFixture
            );

            const result = await extractValidationReport(dataset);
            expect(result.conforms).toBe(false);
            expect(result.results.length).toEqual(3);
        });

        it('should extract validation results from the successful dataset', async () => {
            const dataset = await processValidationResult(
                successfulDatasetFixture
            );

            const result = await extractValidationReport(dataset);
            expect(result.conforms).toBe(true);
            expect(result.results).toEqual([]);
        });

        it('should replace the namespaces by their prefixes', async () => {
            const dataset = await processValidationResult(
                failingDatasetFixture
            );

            const result = await extractValidationReport(dataset);
            result.results.forEach((validationResult) => {
                expect(validationResult.focusNode).toContain('ex:');
                expect(validationResult.path).toContain('schema:');
                expect(validationResult.sourceConstraintComponent).toContain(
                    'sh:'
                );
            });
        });
    });
});
