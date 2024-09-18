import axios from 'axios';
import { processValidationResult } from '../services/validation-processing-service';
import DatasetExt from 'rdf-ext/lib/Dataset';

const VALIDATION_URL = 'http://localhost:3000';

type ValidationParams = {
    datafile: File;
    shapesfile: File;
};

const validate = ({
    datafile,
    shapesfile,
}: ValidationParams): Promise<DatasetExt> => {
    const formData = new FormData();
    formData.append('datafile', datafile);
    formData.append('shapesfile', shapesfile);

    return axios({
        method: 'POST',
        url: `${VALIDATION_URL}/validate`,
        data: formData,
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
        .then((response) => response.data)
        .then(processValidationResult)
        .catch((error) => {
            if (axios.isAxiosError(error)) {
                if (error.response) {
                    const status = error.response.status;
                    if (status === 401) throw Error('Unauthorized');
                    if (status === 403) throw Error('Forbidden');
                    if (status === 409) throw Error('Already exists');
                    if (status === 500)
                        throw Error('Error. Please contact your administrator');
                }
            }
            throw Error(error.message);
        });
};

export const ValidationApi = { validate };
