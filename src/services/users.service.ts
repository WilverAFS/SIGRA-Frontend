// src/services/users.service.ts
import api from './api';

export const usersService = {
  list() {
    return api.get('/users');
  },
};