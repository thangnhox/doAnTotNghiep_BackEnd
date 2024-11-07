import { Request, Response } from 'express';

export function checkReqUser(req: Request, res: Response, admin: number = 1): boolean {
    if (req.user === undefined) {
        res.status(500).json({ message: "Error getting data from authentication" });
        return false;
    }
    if (req.user.isAdmin !== admin) {
        res.status(403).send('Invalid user');
        return false;
    }
    return true;
}

export function orderChecker(order: string) {
    if (!order) return false;
    return (order.toLowerCase() === 'asc') || (order.toLowerCase() === 'desc');
}

type OrderType = 'asc' | 'desc';

interface defaultSorter {
    defaultSort?: string;
    defaultOrder?: OrderType;
}

export function sortValidator(sort: string, order: string, entity: any, {defaultSort = 'null', defaultOrder = 'asc'}: defaultSorter = {}) {
    let status = 0;
    let warnings: string[] = [];

    if (!entity.validSortColumn.includes(defaultSort)) {
        defaultSort = entity.validSortColumn[0];
    }

    if (sort && !entity.validSortColumn.includes(sort)) {
        status += 1;
        warnings.push(`Invalid sort query: '${sort}'. Defaulting to '${defaultSort}'.`);
    }
    if (order && !orderChecker(order)) {
        status += 2;
        warnings.push(`Invalid order query: '${order}'. Defaulting to 'asc'.`);
    }

    return {
        status,
        sort: (!(status & 1) && sort) ? sort : defaultSort,
        order:  (!(status & 2) && order) ? order : defaultOrder,
        warnings: warnings.length > 0 ? warnings : undefined
    }
}