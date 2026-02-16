const mongoose = require('mongoose');
const connect = async (uri) => {
  return mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
};

module.exports = connect;
