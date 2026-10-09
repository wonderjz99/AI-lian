import companies from './companies.json';
import articles from './articles.json';
import events from './events.json';
import relationships from './relationships.json';
import metadata from './metadata.json';
import { datasetSchema } from '../lib/schema';

export const dataset = datasetSchema.parse({ companies, articles, events, relationships, metadata });
export const companyById = new Map(dataset.companies.map(c => [c.id, c]));
export const articleById = new Map(dataset.articles.map(a => [a.id, a]));
