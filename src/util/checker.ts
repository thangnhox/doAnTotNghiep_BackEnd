import { Request, Response } from 'express';
import { ParsedQs } from 'qs';

export function checkReqUser(req: Request, res: Response, admin: number = 1): boolean {
    if (req.user === undefined) {
        res.status(500).json({ message: "Error getting data from authentication" });
        return false;
    }
    if (req.user.isAdmin !== admin) {
        res.status(403).json({ message: "Invalid user" });
        return false;
    }
    return true;
}

export function orderChecker(order: string) {
    return ['ASC', 'DESC'].includes(order.toUpperCase());
}

type OrderType = 'ASC' | 'DESC';

interface DefaultSorter {
    defaultSort?: string;
    defaultOrder?: OrderType;
}

export function sortValidator(sort: string, order: string, entity: any, { defaultSort = 'null', defaultOrder = 'ASC' }: DefaultSorter = {}): {
    status: number,
    sort: string,
    order: OrderType,
    warnings: string[] | undefined
} {
    let status = 0;
    let warnings: string[] = [];

    if (!entity.validSortColumn.includes(defaultSort)) {
        defaultSort = entity.validSortColumn[0];
    }

    if (sort && !entity.validSortColumn.includes(sort)) {
        status += 1;
        warnings.push(`Invalid sort query: '${sort}'. Defaulting to '${defaultSort}'.`);
    }

    function orderChecker(order: string): boolean {
        return ['ASC', 'DESC'].includes(order.toUpperCase());
    }

    if (order && !orderChecker(order)) {
        status += 2;
        warnings.push(`Invalid order query: '${order}'. Defaulting to 'ASC'.`);
    }

    return {
        status,
        sort: (!(status & 1) && sort) ? sort : defaultSort,
        order: (!(status & 2) && order) ? order.toUpperCase() as OrderType : defaultOrder,
        warnings: warnings.length > 0 ? warnings : undefined
    }
}


export function getValidatedPageInfo(query: ParsedQs): { page: number, pageSize: number, offset: number } {
    const page = Math.max(parseInt(query.page as string, 10), 1) || 1;
    const pageSize = Math.max(parseInt(query.pageSize as string, 10), 1) || 10;
    const offset = (page - 1) * pageSize;
    return { page, pageSize, offset };
}

export function getValidateBookPage(query: ParsedQs): { page: number, width: number, height: number, density: number } {
    const page = Math.max(parseInt(query.page as string, 10), 1) || 1;
    const width = Math.max(parseInt(query.width as string, 10), 1) || 600;
    const height = Math.max(parseInt(query.height as string, 10), 1) || 600;
    const density = Math.max(parseInt(query.density as string, 10), 1) || 100;
    return { page, width, height, density };
}

export function getDateFromToday(days: number): string {
    const today = new Date();
    const next30Days = new Date(today.setDate(today.getDate() + days));
    const formattedDate = next30Days.toISOString().split('T')[0];
    return formattedDate;
}

export function getDateNDaysAhead(givenDate: string, n: number): string {
    const date = new Date(givenDate);
    date.setDate(date.getDate() + n);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function isValidUrl(url: string) {
    try {
        const validUrl = new URL(process.env.FRONT_END_ADDR as string);
        const checkUrl = new URL(url);

        return validUrl.hostname === checkUrl.hostname &&
            validUrl.port === checkUrl.port;

    } catch (error) {
        console.error("Invalid URL format:", error);
        return false;
    }
}

export function generateRandomString(length: number = 6): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}
