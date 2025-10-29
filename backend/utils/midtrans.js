const midtransClient = require('midtrans-client');

const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

const createMidtransTransaction = async (transactionDetails) => {
  try {
    const parameter = {
      transaction_details: {
        order_id: transactionDetails.order_id,
        gross_amount: transactionDetails.gross_amount
      },
      customer_details: transactionDetails.customer_details,
      enabled_payments: ['gopay', 'qris', 'shopeepay', 'other_qris']
    };

    const transaction = await snap.createTransaction(parameter);
    return transaction;
  } catch (error) {
    console.error('Midtrans transaction error:', error);
    throw error;
  }
};

module.exports = { createMidtransTransaction };