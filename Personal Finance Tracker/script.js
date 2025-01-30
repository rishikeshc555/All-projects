const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('User', userSchema);
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Transaction', transactionSchema);
const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');

// Route to add a new transaction
router.post('/', async (req, res) => {
  const { type, amount, description, userId } = req.body;

  try {
    const newTransaction = new Transaction({
      type,
      amount,
      description,
      user: userId,
    });

    await newTransaction.save();
    res.status(201).json(newTransaction);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Route to get transactions for a user
router.get('/:userId', async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.params.userId });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
import React, { useState } from 'react';
import axios from 'axios';

const AddTransaction = ({ userId }) => {
  const [type, setType] = useState('income');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post('http://localhost:5000/api/transactions', {
        type,
        amount,
        description,
        userId,
      });
      // Clear the form after submission
      setAmount('');
      setDescription('');
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      />
      <select onChange={(e) => setType(e.target.value)} value={type}>
        <option value="income">Income</option>
        <option value="expense">Expense</option>
      </select>
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      ></textarea>
      <button type="submit">Add Transaction</button>
    </form>
  );
};

export default AddTransaction;
