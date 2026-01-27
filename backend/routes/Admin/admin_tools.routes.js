const express = require('express');
const { authenticator } = require('../../middlewares/authenticator.middleware');
const { adminMiddleware } = require('../../middlewares/admin.middleware');
const { emptyDatabase, dbStatus, initDummy } = require('../../controllers/admin_tools.controller');

const AdminToolsRouter = express.Router();

AdminToolsRouter.delete('/empty-database', authenticator, adminMiddleware, emptyDatabase);

AdminToolsRouter.get('/db-status', authenticator, adminMiddleware, dbStatus);

AdminToolsRouter.post('/init-dummy', authenticator, adminMiddleware, initDummy);

module.exports = { AdminToolsRouter };
