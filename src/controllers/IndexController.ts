import { Request, Response } from 'express';

class IndexController {

    index(req: Request, res: Response): void {
        res.status(400).json({message: "invalid path"});
    }

}

export default new IndexController;