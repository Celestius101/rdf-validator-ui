import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ValidatorStepper from './components/stepper/validator-stepper';
import { CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';

function App() {
    const queryClient = new QueryClient();
    return (
        <QueryClientProvider client={queryClient}>
            <CssBaseline enableColorScheme>
                <SnackbarProvider autoHideDuration={3000}>
                    <ValidatorStepper />
                </SnackbarProvider>
            </CssBaseline>
        </QueryClientProvider>
    );
}

export default App;
