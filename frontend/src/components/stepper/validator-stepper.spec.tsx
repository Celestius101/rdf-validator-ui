import { render, fireEvent, waitFor, cleanup } from '@testing-library/react';
import ValidatorStepper from './validator-stepper';
import { useValidateFilesMutation } from '../../queries/validation-query-hooks';
import { Mock } from 'vitest';
import { useSnackbar } from 'notistack';
import { processValidationResult } from '../../services/validation-processing-service';
import { failingDatasetFixture } from '../../fixtures/dataset';

vi.mock('../../queries/validation-query-hooks');
vi.mock('notistack', () => ({
    useSnackbar: vi.fn(),
}));
const useValidateFilesMutationMock = useValidateFilesMutation as Mock;
const useSnackbarMock = useSnackbar as Mock;

describe('<ValidatorStepper />', () => {
    const mockMutate = vi.fn();
    const mockSnackbar = vi.fn();

    const validationMutation = {
        mutate: mockMutate,
        isPending: false,
    };
    beforeEach(() => {
        mockMutate.mockImplementation(async (files, { onSuccess, onError }) => {
            onSuccess(await processValidationResult(failingDatasetFixture));
        });
        useValidateFilesMutationMock.mockReturnValue(validationMutation);
        useSnackbarMock.mockReturnValue({
            enqueueSnackbar: mockSnackbar,
        });
    });

    afterEach(cleanup);

    it('should disable Back button on first step', () => {
        const component = render(<ValidatorStepper />);
        expect(component.getByRole('button', { name: 'Back' })).toBeDisabled();
    });

    it('should disable Next button if files are not selected', () => {
        const component = render(<ValidatorStepper />);
        expect(component.getByRole('button', { name: 'Next' })).toBeDisabled();
    });

    it('should render ValidatorStepper and the first step', () => {
        const component = render(<ValidatorStepper />);

        expect(component.getByText('Upload RDF data')).toBeDefined();
        expect(component.getByText('Upload SHACL shape')).toBeDefined();
        expect(component.getByText('Validation report')).toBeDefined();
        expect(
            component.getByText(
                'Drag and drop a RDF graph here or click to select it'
            )
        ).toBeDefined();
    });

    it('should navigate to the next step when "Next" button is clicked', async () => {
        const component = render(<ValidatorStepper />);
        const nextButton = component.getByRole('button', { name: 'Next' });

        fireEvent.change(component.getByTestId('file-input'), {
            target: {
                files: [
                    new File(['rdf content'], 'data.ttl', {
                        type: 'text/turtle',
                    }),
                ],
            },
        });

        await waitFor(() => expect(nextButton).toBeEnabled());
        fireEvent.click(component.getByRole('button', { name: 'Next' }));
        await waitFor(() => {
            expect(
                component.getByText(
                    'Drag and drop a SHACL shape here or click to select it'
                )
            ).toBeDefined();
        });
    });

    it('should call mutation when upload data and shape file and clicking validate', async () => {
        const datafile = new File(['rdf content'], 'data.ttl', {
            type: 'text/turtle',
        });
        const shapesfiles = new File(['shapes content'], 'shapes.ttl', {
            type: 'text/turtle',
        });

        const component = render(<ValidatorStepper />);

        const nextButton = component.getByRole('button', { name: 'Next' });

        fireEvent.change(component.getByTestId('file-input'), {
            target: {
                files: [datafile],
            },
        });

        await waitFor(() => expect(nextButton).toBeEnabled());

        fireEvent.click(nextButton);

        fireEvent.change(component.getByTestId('file-input'), {
            target: {
                files: [shapesfiles],
            },
        });

        const validateButton = await waitFor(() =>
            component.getByRole('button', { name: 'Validate' })
        );

        fireEvent.click(validateButton);

        await waitFor(() => {
            expect(mockMutate).toHaveBeenCalledWith(
                {
                    datafile: expect.any(File),
                    shapesfile: expect.any(File),
                },
                expect.any(Object)
            );
        });
    });

    it('should display error message on validation failure', async () => {
        const mockMutate = vi.fn();
        mockMutate.mockImplementation((files, { onError }) => {
            onError();
        });
        useValidateFilesMutationMock.mockReturnValue({
            mutate: mockMutate,
            isPending: false,
        });

        const datafile = new File(['rdf content'], 'data.ttl', {
            type: 'text/turtle',
        });
        const shapesfiles = new File(['shapes content'], 'shapes.ttl', {
            type: 'text/turtle',
        });

        const component = render(<ValidatorStepper />);

        const nextButton = component.getByRole('button', { name: 'Next' });

        fireEvent.change(component.getByTestId('file-input'), {
            target: {
                files: [datafile],
            },
        });

        await waitFor(() => expect(nextButton).toBeEnabled());

        fireEvent.click(nextButton);

        fireEvent.change(component.getByTestId('file-input'), {
            target: {
                files: [shapesfiles],
            },
        });

        const validateButton = await waitFor(() =>
            component.getByRole('button', { name: 'Validate' })
        );

        fireEvent.click(validateButton);

        await waitFor(() => {
            expect(mockMutate).toHaveBeenCalled();
            expect(mockSnackbar).toHaveBeenCalledWith(
                'Network Error. Please contact your administrator.',
                { variant: 'error' }
            );
        });
    });

    it('should resets stepper on "Reset" button click', async () => {
        const datafile = new File(['rdf content'], 'data.ttl', {
            type: 'text/turtle',
        });
        const shapesfiles = new File(['shapes content'], 'shapes.ttl', {
            type: 'text/turtle',
        });

        const component = render(<ValidatorStepper />);

        const nextButton = component.getByRole('button', { name: 'Next' });

        fireEvent.change(component.getByTestId('file-input'), {
            target: {
                files: [datafile],
            },
        });

        await waitFor(() => expect(nextButton).toBeEnabled());

        fireEvent.click(nextButton);

        fireEvent.change(component.getByTestId('file-input'), {
            target: {
                files: [shapesfiles],
            },
        });

        const validateButton = await waitFor(() =>
            component.getByRole('button', { name: 'Validate' })
        );

        fireEvent.click(validateButton);

        const resetButton = await waitFor(() =>
            component.getByRole('button', { name: 'Reset' })
        );
        fireEvent.click(resetButton);

        await waitFor(() => {
            expect(
                component.getByText(
                    'Drag and drop a RDF graph here or click to select it'
                )
            ).toBeDefined();
        });
    });
});
