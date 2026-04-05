const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { errorHandler } = require('./middlewares/errorHandler');
const path = require('path');
const methodOverride = require('method-override');

const app = express();

// Middleware để hỗ trợ HTTP PUT và DELETE từ form
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// cấu hình view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Cấu hình thư mục chứa tệp tĩnh (CSS, JS, Images)
app.use(express.static(path.join(__dirname, '../public')));

// Middleware xử lý dữ liệu từ Form (URL Encoded)
app.use(express.urlencoded({ extended: true }));

app.use(express.json());
app.use(cors());
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));



app.use(errorHandler);

module.exports = app;