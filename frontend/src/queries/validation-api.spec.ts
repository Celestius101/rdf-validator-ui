import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { failingDatasetFixture } from '../fixtures/dataset';
import { ValidationApi } from './validation-api';

const mock = new MockAdapter(axios);

describe('ValidationApi', async () => {
    const VALIDATION_URL = 'http://localhost:3000/validate';

    const datafile = new File(['rdf content'], 'data.ttl', {
        type: 'text/turtle',
    });
    const shapesfile = new File(['shapes content'], 'shapes.ttl', {
        type: 'text/turtle',
    });

    beforeEach(() => mock.reset());

    it('should send a POST request with the correct form data and process the result', async () => {
        mock.onPost(VALIDATION_URL).reply(200, failingDatasetFixture);

        const result = await ValidationApi.validate({
            datafile,
            shapesfile,
        });

        expect(result.size).toBeGreaterThan(0);
    });

    it('should throw an error when the request fails with a 401', async () => {
        mock.onPost(VALIDATION_URL).reply(401);

        const result = ValidationApi.validate({
            datafile,
            shapesfile,
        });

        await expect(result).rejects.toThrow('Unauthorized');
    });

    it('should throw an error when the request fails with a 403', async () => {
        mock.onPost(VALIDATION_URL).reply(403);

        const result = ValidationApi.validate({
            datafile,
            shapesfile,
        });

        await expect(result).rejects.toThrow('Forbidden');
    });

    it('should throw an error when the request fails with a 500', async () => {
        mock.onPost(VALIDATION_URL).reply(500);

        const result = ValidationApi.validate({
            datafile,
            shapesfile,
        });

        await expect(result).rejects.toThrow(
            'Error. Please contact your administrator'
        );
    });

    it('should throw a generic error if an unknown error occurs', async () => {
        mock.onPost(VALIDATION_URL).reply(418);

        const result = ValidationApi.validate({
            datafile,
            shapesfile,
        });
        await expect(result).rejects.toThrow(
            'Request failed with status code 418'
        );
    });
});
