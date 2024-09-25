import { render } from '@testing-library/react';
import CustomDropZone from './custom-drop-zone';

describe('<CustomDropZone/>', () => {
    it('should display properly dynamic text prop', () => {
        const text = 'Display test text';
        const component = render(
            <CustomDropZone text={text} onSelectFile={vi.fn()} />
        );

        expect(component.getByText(text)).toBeDefined();
    });
});
