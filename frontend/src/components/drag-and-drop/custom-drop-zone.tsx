import Dropzone from 'react-dropzone';
import { FC, useState } from 'react';
import styled from '@emotion/styled';
import { lighten } from '@mui/material';
import Typography from '@mui/material/Typography';
import CheckCircle from '@mui/icons-material/CheckCircle';
import FilePresent from '@mui/icons-material/FilePresent';

type Props = {
    text: string;
    onSelectFile: (file: File) => void;
};

/**
 * Dynamically returns a border color based on the drag status of the component.
 *
 * @param isDragAccept A boolean representing whether the drag would be accepted
 * @param isDragReject A boolean representing whether the drag would be rejected
 * @returns '#2e7d32' if drag is accepted, '#d32f2f' if rejected and a light '#1976d2' otherwise
 */
const getBorderColor = (isDragAccept: boolean, isDragReject: boolean) => {
    if (isDragAccept) {
        return '#2e7d32';
    }
    if (isDragReject) {
        return '#d32f2f';
    }
    return lighten('#1976d2', 0.5);
};

const Container = styled('div', {
    shouldForwardProp: (prop) =>
        prop !== 'isDragAccept' && prop !== 'isDragReject',
})<{ isDragAccept: boolean; isDragReject: boolean }>(
    ({ isDragAccept, isDragReject }) => ({
        display: 'flex',
        height: '200px',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '20px',
        padding: '150px',
        borderWidth: '2px',
        borderRadius: '2px',
        borderColor: getBorderColor(isDragAccept, isDragReject),
        borderStyle: 'dashed',
        outline: 'none',
        color: '#1976d2',
    })
);

/**
 * A function component representing a drop zone for file upload.
 *
 * @param text A dynamic text to be displayed inside the drop zone
 * @param onSelectFile A listener executed when the file is accepted as uploaded by the drop zone
 * @returns The function component
 */
const CustomDropZone: FC<Props> = ({ text, onSelectFile }) => {
    const [file, setFile] = useState<File>();

    return (
        <Dropzone
            maxFiles={1}
            accept={{ 'text/turtle': ['.ttl'] }}
            validator={(file) => {
                if (file.type === 'text/turtle') return null;
                else
                    return {
                        code: 'file-invalid-type',
                        message: `Invalid file type. Please upload a turtle file.`,
                    };
            }}
            onDropAccepted={(files) => {
                onSelectFile(files[0]);
                setFile(files[0]);
            }}
        >
            {({ getRootProps, getInputProps, isDragAccept, isDragReject }) => (
                <section>
                    <Container
                        {...getRootProps({ isDragAccept, isDragReject })}
                    >
                        <input data-testid="file-input" {...getInputProps()} />
                        {!file && !isDragReject && !isDragAccept && (
                            <Typography
                                sx={{ textAlign: 'center', width: '250px' }}
                            >
                                {text}
                            </Typography>
                        )}
                        {isDragReject && (
                            <Typography color="error">
                                Please submit a single turtle file (.ttl)
                            </Typography>
                        )}
                        {isDragAccept && (
                            <CheckCircle color="success" fontSize="large" />
                        )}
                        {file && !isDragReject && !isDragAccept && (
                            <>
                                <FilePresent fontSize="large" />
                                <Typography fontWeight="bold" sx={{ ml: 2 }}>
                                    {file.name}
                                </Typography>
                            </>
                        )}
                    </Container>
                </section>
            )}
        </Dropzone>
    );
};

export default CustomDropZone;
