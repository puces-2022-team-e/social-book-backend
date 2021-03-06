import express, { Response, Request } from 'express';
import auth from '../middleware/auth';
import { BooksServices } from '../services/book/book.service';
import { DataBaseServices } from '../services/database.services';
const router = express.Router();

export const booksRouter = (db: DataBaseServices) => {
	const booksService = new BooksServices(db);

	router.get('/', auth, async (req: Request, res: Response) => {
		const response = await booksService.getEntity();
		res.status(response.statusCode).send(response.body);
	});

	router.get('/:id', auth, async (req: Request, res: Response) => {
		const response = await booksService.getEntity(req?.params?.id);
		res.status(response.statusCode).send(response.body);
	});

	router.put('/:id', auth, async (req: Request, res: Response) => {
		const response = await booksService.updateEntity(req?.params?.id, req?.body);
		res.status(response.statusCode).send(response.body);
	});

	router.post('/', auth, async (req: Request, res: Response) => {
		const response = await booksService.newEntity(req?.body);
		res.status(response.statusCode).send(response.body);
	});

	router.delete('/:id', auth, async (req: Request, res: Response) => {
		const response = await booksService.deleteEntity(req?.params?.id);
		res.status(response.statusCode).send(response.body);
	});

	return router;
};
