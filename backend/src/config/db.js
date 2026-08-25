const mongoose = require('mongoose');

// useNewUrlParser / useUnifiedTopology were removed in Mongoose 6 and throw an
// "option not supported" error on the Mongoose 7 this project depends on.
const connect = async (uri) => mongoose.connect(uri, {
  serverSelectionTimeoutMS: Number(process.env.MONGO_TIMEOUT_MS) || 5000
});

module.exports = connect;
