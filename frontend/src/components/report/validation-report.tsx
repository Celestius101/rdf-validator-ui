import DatasetExt from 'rdf-ext/lib/Dataset';
import { FC, useEffect, useState } from 'react';
import { extractValidationReport } from '../../services/validation-processing-service';
import { ValidationReport as Report } from '../../models/validation-report';
import { Severity, ValidationResult } from '../../models/validation-result';
import Alert from '@mui/material/Alert';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Chip from '@mui/material/Chip';
import { Box, Stack, Typography } from '@mui/material';

/**
 * Maps validation report severities violation to chip color
 *
 * @param severity The severity of a violation from the validation report
 * @return The mapped color : 'info' | 'warning' | 'error'
 */
const toChipSeverity = (severity: Severity): 'info' | 'warning' | 'error' => {
    switch (severity) {
        case 'Info':
            return 'info';
        case 'Warning':
            return 'warning';
        case 'Violation':
            return 'error';
    }
};

type Props = {
    dataset: DatasetExt;
};

/**
 * A function component representing a validation report
 * displaying whether it is conform. If it's not, the reasons why
 * are display additionally.
 *
 * @param dataset The dataset containing the validation report
 * @returns The function component
 */
const ValidationReport: FC<Props> = ({ dataset }) => {
    const [report, setReport] = useState<Report>();

    useEffect(() => {
        setReport(extractValidationReport(dataset));
    }, [dataset]);

    return (
        report && (
            <Box sx={{ padding: '50px' }}>
                <Alert
                    variant="filled"
                    severity={report.conforms ? 'success' : 'error'}
                    sx={{ mb: 3 }}
                >
                    {report.conforms
                        ? 'Dataset valid under provided SHACL shapes.'
                        : 'Anomalies encountered during SHACL constraint validation.'}
                </Alert>

                {report?.results.map((result: ValidationResult, index) => {
                    return (
                        <Accordion key={index}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Stack
                                    direction="row"
                                    spacing="10px"
                                    sx={{
                                        justifyContent: 'flex-start',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Chip
                                        label={result.severity}
                                        color={toChipSeverity(result.severity)}
                                    />
                                    <Typography>{result.focusNode}</Typography>
                                </Stack>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography>
                                    <b>Path : </b> <i>{result.path}</i>
                                </Typography>
                                <Typography>
                                    <b>Message : </b> <i>{result.message}</i>
                                </Typography>
                                <Typography>
                                    <b>SourceConstraintComponent : </b>
                                    <i>{result.sourceConstraintComponent}</i>
                                </Typography>
                                {result.value && (
                                    <Typography>
                                        <b>Value : </b>
                                        <i>{result.value}</i>
                                    </Typography>
                                )}
                            </AccordionDetails>
                        </Accordion>
                    );
                })}
            </Box>
        )
    );
};
export default ValidationReport;
