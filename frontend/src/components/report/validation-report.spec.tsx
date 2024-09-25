import { processValidationResult } from '../../services/validation-processing-service';
import {
    failingDatasetFixture,
    successfulDatasetFixture,
} from '../../fixtures/dataset';
import { cleanup, render } from '@testing-library/react';
import ValidationReport from './validation-report';
import DatasetExt from 'rdf-ext/lib/Dataset';
import React from 'react';

vi.mock('@mui/material/Accordion', () => ({
    default: ({ children }: { children: React.ReactNode }) => (
        <span>{children}</span>
    ),
}));

vi.mock('@mui/material/AccordionSummary', () => ({
    default: ({ children }: { children: React.ReactNode }) => (
        <span>{children}</span>
    ),
}));

vi.mock('@mui/material/AccordionDetails', () => ({
    default: ({ children }: { children: React.ReactNode }) => (
        <span>{children}</span>
    ),
}));

describe('<ValidationReport />', () => {
    afterEach(cleanup);

    it('should properly display a successful dataset', async () => {
        const dataset = await processValidationResult(successfulDatasetFixture);

        const component = render(
            <ValidationReport dataset={dataset as DatasetExt} />
        );

        expect(
            component.getByText('Dataset valid under provided SHACL shapes.')
        ).toBeDefined();
    });

    it('should properly display a failing dataset', async () => {
        const dataset = await processValidationResult(failingDatasetFixture);

        const component = render(
            <ValidationReport dataset={dataset as DatasetExt} />
        );

        expect(
            component.getByText(
                'Anomalies encountered during SHACL constraint validation.'
            )
        ).toBeDefined();
        expect(component.getAllByText('ex:Bob').length).toBe(3);
        expect(component.getByText('schema:email')).toBeDefined();
        expect(component.getByText('schema:telephone')).toBeDefined();
        expect(component.getByText('schema:birthDate')).toBeDefined();
    });
});
