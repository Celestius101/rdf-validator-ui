import { useMutation } from '@tanstack/react-query';
import { ValidationApi } from './validation-api';

export const useValidateFilesMutation = () =>
    useMutation({
        mutationFn: ValidationApi.validate,
    });
