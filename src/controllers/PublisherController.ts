import { Request, Response } from 'express';
import { createAppDataSource } from '../models/repository/Datasource';
import { Publisher } from '../models/entities/Publisher';
import { checkReqUser } from '../util/checker';

class PublisherController {
    async all(req: Request, res: Response): Promise<void> {
        const AppDataSource = createAppDataSource();
        await AppDataSource.initialize();
        
        try {
            const publisherRepository = AppDataSource.getRepository(Publisher);
            const publishers = await publisherRepository.find();
            res.status(200).json({ message: "fetch success", data: publishers });
        } catch (error: any) {
            res.status(500).json({ message: "failed to fetch publishers", error: error.message });
        } finally {
            await AppDataSource.destroy();
        }
    }

    async add(req: Request, res: Response): Promise<void> {
        if (!checkReqUser(req, res)) return;

        if (!req.body.publisherName) {
            res.status(400).send("invalid request");
            return;
        }

        const AppDataSource = createAppDataSource();
        await AppDataSource.initialize();

        const publisherRepository = AppDataSource.getRepository(Publisher);
        const publisher = await publisherRepository.findOne({ where: { name: req.body.publisherName } });

        if (publisher !== null) {
            res.status(409).json({ message: "Publisher already exist", data: publisher });
            await AppDataSource.destroy();
            return;
        }

        let newPublisher = new Publisher();
        newPublisher.name = req.body.publisherName;
        const toDatabase = publisherRepository.create(newPublisher);

        try {
            const savedPublisher = await publisherRepository.save(toDatabase);

            res.status(201).json({ message: "Add publisher success", data: savedPublisher });
        } catch (error: any) {
            res.status(500).json({ message: "Failed to add publisher", error: error });
        } finally {
            await AppDataSource.destroy();
        }
    }
}

export default new PublisherController;