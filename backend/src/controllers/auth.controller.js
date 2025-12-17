/**
 * Auth Controller
 * Handles authentication HTTP requests
 *
 * @module controllers/auth
 */

const { authService } = require('../services');
const { ApiResponse } = require('../utils');
const { asyncHandler } = require('../middlewares');

/**
 * Register new user
 * POST /api/admin/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  ApiResponse.created(res, user, 'User registered successfully');
});

/**
 * Login user
 * POST /api/admin/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  ApiResponse.success(res, result, 'Login successful');
});

/**
 * Refresh access token
 * POST /api/admin/auth/refresh
 */
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const result = await authService.refreshToken(refreshToken);
  ApiResponse.success(res, result, 'Token refreshed successfully');
});

/**
 * Logout user
 * POST /api/admin/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  await authService.logout(refreshToken);
  ApiResponse.success(res, null, 'Logged out successfully');
});

/**
 * Get current user profile
 * GET /api/admin/auth/me
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.id);
  ApiResponse.success(res, user);
});

/**
 * Change password
 * POST /api/admin/auth/change-password
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user.id, currentPassword, newPassword);
  ApiResponse.success(res, null, 'Password changed successfully');
});

/**
 * Logout from all devices
 * POST /api/admin/auth/logout-all
 */
const logoutAll = asyncHandler(async (req, res) => {
  await authService.logoutAll(req.user.id);
  ApiResponse.success(res, null, 'Logged out from all devices');
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  changePassword,
  logoutAll
};
