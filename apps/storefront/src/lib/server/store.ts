import 'server-only';

import { matchSorter } from 'match-sorter';

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface PaginationParams {
  limit?: number;
  offset?: number;
  search?: string;
}

export class Store<T extends { id: string }> {
  id = crypto.randomUUID();
  records: T[];

  constructor(records?: T[]) {
    this.records = records ?? [];
  }

  async list(params: PaginationParams): Promise<{ data: T[]; total: number }> {
    const { limit = 10, offset = 0, search } = params;
    let [...records] = this.records;

    if (search) {
      records = matchSorter(records, search, {
        keys: ['id'],
      });
    }

    const total = records.length;
    const data = records.slice(offset, offset + limit);

    return { data, total };
  }

  async getById(id: string): Promise<T | undefined> {
    return this.records.find((record) => record.id === id) as T | undefined;
  }

  async create(record: T): Promise<T> {
    this.records.push(record);
    return record;
  }

  async update(id: string, record: T): Promise<T> {
    const index = this.records.findIndex((record) => record.id === id);
    if (index === -1) {
      throw new Error('Record not found');
    }
    this.records[index] = record;
    return record;
  }

  async delete(id: string): Promise<void> {
    const index = this.records.findIndex((record) => record.id === id);
    if (index === -1) {
      throw new Error('Record not found');
    }
    this.records.splice(index, 1);
  }
}
