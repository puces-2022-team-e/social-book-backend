import { Response, Request } from 'express';
import { BooksSerializer } from '../data/bookSerializer';
import { DataBaseServices } from '../services/database.services';

const ERROR_MSG = 'internal server Error';
const dataBase = new DataBaseServices();
const COLLECTION = 'books';
class BooksController {
	static async getBooks(req: Request, res: Response) {
		const id = req?.params?.id;

		try {
			var books;
			var query = {};
			if (id) {
				console.log(`getBooks-> id: ${id}`)
				query = queryBuilder(id);
			}

			await dataBase.connect();

			books = await dataBase.findAny(query, COLLECTION);

			await dataBase.disconnect();

			if (!books) {
				res.status(404).send(`book ${id} not found`);
			} else {
				res.status(200).send(books);
			}
		} catch (e) {
			console.error(e);
			await dataBase.disconnect();
			res.status(500).send(ERROR_MSG);
		}
	}

	static async postBook(req: Request, res: Response) {
		const bookPayload = req.body;
		console.log( `adding new book`)
		if (bookPayload) {
			const bookInitialSetUP = BooksSerializer.InitialBookObject(bookPayload)
			console.log(`New book: ${bookInitialSetUP}`);
			try {
				await dataBase.connect();
				const ret = await dataBase.insertOne(bookInitialSetUP, COLLECTION);
				await dataBase.disconnect();
				res.status(201).send({
					status: 'success',
					id: ret?.insertedId,
				});
			} catch (e) {
				console.error(e);
				res.status(500).send(ERROR_MSG);
			}
		} else {
			res.status(500).send({
				error: ERROR_MSG,
				message: 'invalid request body; Body must be a book object',
			});
		}
	}

	static async updateBook(req: Request, res: Response) {
		const values = req?.body;

		const id = req?.params?.id;

		if (id && values) {
			console.log(`Updating book ${id}`);
			try {
				const query = queryBuilder(id);

				const newValues = { $set: values };

				await dataBase.connect();

				const ret = await dataBase.updateOne(query, newValues, COLLECTION);

				await dataBase.disconnect();

				if (ret?.modifiedCount && ret?.modifiedCount > 0) {
					res.status(200).send({
						status: 200,
						message: `Document ${id} successfully updated`,
					});
				} else {
					throw new Error(`Error while trying to update book ${id}`);
				}
			} catch (e) {
				console.error(e);
				res.status(500).send({
					status: 500,
					message: ERROR_MSG,
					error: e,
				});
			}
		} else {
			res.status(500).send({
				status: 500,
				message: ERROR_MSG + ` Missing Body or ID`,
			});
		}
	}

	static async deleteBook(req: Request, res: Response) {
		const id = req?.params?.id;
		console.log(`deleting book: ${id}!`);
		if (id) {
			try {
				await dataBase.connect();

				const query = queryBuilder(id);

				const ret = await dataBase.deleteOne(query, COLLECTION);
				await dataBase.disconnect();
				if (ret?.deletedCount === 1) {
					res.status(200).send({
						status: 200,
						message: `deleted: ${ret?.deletedCount}`,
					});
				} else {
					throw new Error(`Cant delete item ${id}`);
				}
			} catch (e) {
				res.status(500).send({
					status: 500,
					message: e,
				});
			}
		} else {
			res.status(500).send({
				status: 500,
				message: ERROR_MSG + ` Missing ID`,
			});
		}
	}

	static async searchBookByString(req: Request, res: Response) {
		console.log(`seaching by query pattern`)
		const pattern = req.query.q;
		console.log(`pattern: ${pattern}`)
		if (pattern) {
			const query = { $text: { $search: pattern } };
			console.log(`query: ${query}`)
			await dataBase.connect();
			console.log(`collection ${COLLECTION}`)
			const books = await dataBase.findAny(query, COLLECTION);
			await dataBase.disconnect();
			res.status(200).send(books);
		} else {
			res.status(404).send({});
		}
	}
}

function queryBuilder(id: any){
	var bookQuery = {};
	if(id){
		const mongoId = dataBase.mongoIDHandler(id);
		if (mongoId) {
			bookQuery = {
				$or: [{ short: id }, { _id: mongoId }],
			};
		} else {
			bookQuery = {
				short: id,
			};
		}
	}
	return bookQuery;
} 
export default BooksController;
