import { BREAKPOINTS } from '@constants';
import { formSize } from '@constants/masterData';
import { useEffect, useState } from 'react';

const useFormWidth = () => {
    const [width, setWidth] = useState(window.innerWidth);
    const handleResize = () => {
        if (width <= BREAKPOINTS.xxl) {
            setWidth(formSize.big);
        } else if (width <= BREAKPOINTS.xxl * 2) {
            setWidth(formSize.large);
        } else if (width <= BREAKPOINTS.xxl * 3) {
            setWidth(formSize.extraLarge);
        }
    };

    useEffect(() => {
        handleResize();
    }, []);

    useEffect(() => {
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return width;
};
export default useFormWidth;
