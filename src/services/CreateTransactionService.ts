import { getCustomRepository, getRepository } from 'typeorm';

import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Request {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}
class CreateTransactionService {
  public async execute({
    title,
    type,
    value,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const { total } = await transactionsRepository.getBalance();

    if (type === 'outcome' && total < value) {
      throw new AppError('You do not have enough balance');
    }

    const categoryRepository = getRepository(Category);
    let localCategory = await categoryRepository.findOne({
      where: { title: category },
    });

    if (!localCategory) {
      localCategory = categoryRepository.create({ title: category });

      await categoryRepository.save(localCategory);
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category: localCategory,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
