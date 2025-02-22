import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

export const getFilterAndSortingOptions = (query: any, userId: any) => {
    const { sortBy, sortOrder, page, pageSize, take, skip, startDate, endDate, ...filters } = query;

    // Sorting
    const orderBy: any = {};
    if (sortBy) {
        orderBy[sortBy] = sortOrder === 'desc' ? 'desc' : 'asc';
    } else {
        orderBy['dateTime'] = 'desc';
    }

    // Filtering

    const where: any = { userId };

    if (!startDate && !endDate) {
        where.dateTime = {
            gte: new Date(dayjs().startOf("month").toISOString()),
            lte: new Date(dayjs().endOf("month").toISOString()),
        };
    } else {
        if (startDate || endDate) {
            where.dateTime = {};
            if (startDate) where.dateTime.gte = new Date(dayjs(startDate).startOf("day").toISOString());
            if (endDate) where.dateTime.lte = new Date(dayjs(endDate).endOf("day").toISOString());
        }
    }

    if (filters && Object.keys(filters).length > 0) {
        Object.keys(filters).forEach((key) => {
            if (filters[key] !== undefined && filters[key] !== '') {
                where[key] = filters[key] === 'true' ? true : filters[key] === 'false' ? false : filters[key];
            }
        });
    }

    return { orderBy, where };
};
