import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
dayjs.extend(weekOfYear);

export const currentWeek = dayjs().week();
export const lastWeek = dayjs().week(currentWeek - 1);

export const getWeek = (date) => {
    return dayjs(date).week();
};

export const getWeekStart = (date) => {
    return dayjs(date).startOf('week');
};

export const getLastWeek = (date) => {
    return dayjs(date).week(getWeek(date) - 1);
};

export const getLastWeekStart = (date) => {
    return dayjs(date).startOf('week').subtract(1, 'week');
};

export const getLastWeekEnd = (date) => {
    return dayjs(date).endOf('week').subtract(1, 'week');
};
