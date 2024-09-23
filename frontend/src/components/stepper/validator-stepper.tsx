import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import MuiCard from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import LoadingButton from '@mui/lab/LoadingButton';
import { styled } from '@mui/material/styles';
import CustomDropZone from '../drag-and-drop/custom-drop-zone';
import { useMemo, useState } from 'react';
import { FC } from 'react';
import ValidationReport from '../report/validation-report';
import { useValidateFilesMutation } from '../../queries/validation-query-hooks';
import DatasetExt from 'rdf-ext/lib/Dataset';
import { useSnackbar } from 'notistack';

const Card = styled(MuiCard)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignSelf: 'center',
    width: '100%',
    padding: theme.spacing(4),
    gap: theme.spacing(2),
    margin: 'auto',
    [theme.breakpoints.up('sm')]: {
        maxWidth: '750px',
    },
    boxShadow:
        'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
    ...theme.applyStyles('dark', {
        boxShadow:
            'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
    }),
}));

const Container = styled(Stack)(({ theme }) => ({
    '&::before': {
        content: '""',
        display: 'block',
        position: 'absolute',
        zIndex: -1,
        inset: 0,
        backgroundImage:
            'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
        backgroundRepeat: 'no-repeat',
        ...theme.applyStyles('dark', {
            backgroundImage:
                'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
        }),
    },
}));

const WordArt = styled('img')(() => ({
    textAlign: 'center',
    height: 304,
    width: 600,
    alignSelf: 'center',
}));

/**
 * The main function component of the application. It is essentially a stepper consisting of the following steps :
 *  1. Upload RDF data
 *  2. Upload SHACL file
 *  (3. Send validation to backend)
 *  4. Display resulting validation report
 *
 * @return The main function component
 */
const ValidatorStepper: FC = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [skipped, setSkipped] = useState(new Set<number>());

    const [datafile, setDataFile] = useState<File>();
    const [shapesfile, setShapesFile] = useState<File>();
    const [report, setReport] = useState<DatasetExt>();

    const validationMutation = useValidateFilesMutation();

    const { enqueueSnackbar } = useSnackbar();

    const stepsWithContent = useMemo(
        () =>
            new Map<string, JSX.Element>([
                [
                    'Upload RDF data',
                    <CustomDropZone
                        key="rdf"
                        text="Drag 'n' drop a RDF graph here or click to select it"
                        onSelectFile={setDataFile}
                    />,
                ],
                [
                    'Upload SHACL shape',
                    <CustomDropZone
                        key="shacl"
                        text="Drag 'n' drop a SHACL shape here or click to select it"
                        onSelectFile={setShapesFile}
                    />,
                ],
                ['Validation report', <ValidationReport dataset={report!} />],
            ]),
        [report]
    );

    const isStepSkipped = (step: number) => {
        return skipped.has(step);
    };

    const handleReset = () => {
        setActiveStep(0);
        setDataFile(undefined);
        setShapesFile(undefined);
        setSkipped(new Set<number>());
        setReport(undefined);
    };

    const getNextButtonLabel = () => {
        switch (activeStep) {
            case 0:
                return 'Next';
            case 1:
                return 'Validate';
            case 2:
                return 'Reset';
        }
    };

    const handleNext = () => {
        if (activeStep === 2) {
            handleReset();
            return;
        }

        if (activeStep !== 1) {
            let newSkipped = skipped;
            if (isStepSkipped(activeStep)) {
                newSkipped = new Set(newSkipped.values());
                newSkipped.delete(activeStep);
            }

            setActiveStep((prevActiveStep) => prevActiveStep + 1);
            setSkipped(newSkipped);
        } else {
            validationMutation.mutate(
                {
                    datafile: datafile!,
                    shapesfile: shapesfile!,
                },
                {
                    onSuccess(data) {
                        setReport(data);
                        let newSkipped = skipped;
                        if (isStepSkipped(activeStep)) {
                            newSkipped = new Set(newSkipped.values());
                            newSkipped.delete(activeStep);
                        }

                        setActiveStep((prevActiveStep) => prevActiveStep + 1);
                        setSkipped(newSkipped);
                    },
                    onError() {
                        enqueueSnackbar(
                            'Network Error. Please contact your administrator.',
                            { variant: 'error' }
                        );
                    },
                }
            );
        }
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
        if (activeStep === 1) setDataFile(undefined);
        if (activeStep === 2) setShapesFile(undefined);
    };

    return (
        <Container direction="column" justifyContent="space-between">
            <WordArt alt="RDF Validator Wordart" src="/wordart.png" />
            <Card variant="outlined">
                <Box>
                    <Stepper alternativeLabel activeStep={activeStep}>
                        {Array.from(stepsWithContent.keys()).map(
                            (label, index) => {
                                const stepProps = {
                                    completed: isStepSkipped(index),
                                };

                                return (
                                    <Step key={label} {...stepProps}>
                                        <StepLabel>{label}</StepLabel>
                                    </Step>
                                );
                            }
                        )}
                    </Stepper>
                    {Array.from(stepsWithContent.values())[activeStep]}
                    <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
                        <Button
                            variant="contained"
                            color="inherit"
                            disabled={
                                activeStep === 0 || validationMutation.isPending
                            }
                            onClick={handleBack}
                            sx={{ mr: 1 }}
                        >
                            Back
                        </Button>
                        <Box sx={{ flex: '1 1 auto' }} />
                        <LoadingButton
                            size="small"
                            onClick={handleNext}
                            disabled={
                                (activeStep === 0 && datafile === undefined) ||
                                (activeStep === 1 && shapesfile === undefined)
                            }
                            loading={validationMutation.isPending}
                            variant="contained"
                        >
                            {getNextButtonLabel()}
                        </LoadingButton>
                    </Box>
                </Box>
            </Card>
        </Container>
    );
};

export default ValidatorStepper;
