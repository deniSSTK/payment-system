import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { getDatabaseConfig } from '../../config/database.config';

const dataSource = new DataSource(getDatabaseConfig(process.env));

export default dataSource;
