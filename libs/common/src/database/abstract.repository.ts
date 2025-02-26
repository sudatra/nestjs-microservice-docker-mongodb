import { Logger, NotFoundException } from '@nestjs/common';
import { FilterQuery, Types, UpdateQuery, SaveOptions, Connection, Model } from 'mongoose';
import { AbstractDocument } from './abstract.schema';

export abstract class AbstractRepository<TDocument extends AbstractDocument> {
    protected abstract readonly logger: Logger;

    constructor(
        protected readonly model: Model<TDocument>,
        private readonly connection: Connection
    ) {}

    async create(document: Omit<TDocument, '_id'>, options?: SaveOptions): Promise<TDocument> {
        const createdDocument = new this.model({
            ...document,
            _id: new Types.ObjectId()
        });

        return (await createdDocument.save(options)).toJSON() as unknown as TDocument;
    }

    async findOne(filterQuery: FilterQuery<TDocument>): Promise<TDocument> {
        const document = await this.model.findOne(filterQuery, {}, { lean: true }) as TDocument;
        if(!document) {
            this.logger.warn('Unable to find required document with filterQuery: ', filterQuery);
            throw new NotFoundException('Document Not Found');
        }

        return document;
    }

    async findOneAndUpdate(filterQuery: FilterQuery<TDocument>, update: UpdateQuery<TDocument>): Promise<TDocument> {
        const document = await this.model.findOneAndUpdate(filterQuery, update, {
            lean: true,
            new: true
        }) as TDocument;
        if(!document) {
            this.logger.warn('Unable to updated required document with filterQuery', filterQuery);
            throw new NotFoundException('Document Not Updated');
        }

        return document;
    }

    async upsert(filterQuery: FilterQuery<TDocument>, document: Partial<TDocument>): Promise<TDocument> {
        return await this.model.findOneAndUpdate(filterQuery, document, {
            lean: true,
            new: true,
            upsert: true
        }) as TDocument;
    }

    async find(filterQuery: FilterQuery<TDocument>): Promise<TDocument> {
        return await this.model.find(filterQuery, {}, { lean: true }) as unknown as TDocument;
    }

    async startTransaction() {
        const session = await this.connection.startSession();
        session.startTransaction();

        return session;
    }
}