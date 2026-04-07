const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const methodOverride = require('method-override');

const app = express();

console.log("🚀 App.js đang khởi tạo...");

// 1. MIDDLEWARES
app.use(cors());
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// 2. VIEW ENGINE
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, '../public')));

// 3. ROUTES
// Vì app.js nằm cùng cấp với thư mục routes nên dùng './routes/...' là đúng
app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/tasks', require('./routes/dashboard.routes'));

app.get('/', (req, res) => res.send('Server is LIVE!'));

// 4. ERROR HANDLER (Tạm thời dùng hàm đơn giản để tránh lỗi require)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

module.exports = app;