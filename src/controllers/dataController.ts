import { Request, Response } from 'express';

class dataController {

    getData(req: Request, res: Response): void {
        res.json({ message: 'GET request to /api/data' });
    }

    postData(req: Request, res: Response): void {
        const data = req.body;
        res.json({ message: 'POST request to /api/data', data });
    }

    putData(req: Request, res: Response): void {
        const id = req.params.id;
        const updatedData = req.body;
        res.json({ message: `PUT request to /api/data/${id}`, updatedData });
    }

    deleteData(req: Request, res: Response): void {
        const id = req.params.id;
        res.json({ message: `DELETE request to /api/data/${id}` });
    }

}

export default new dataController;
