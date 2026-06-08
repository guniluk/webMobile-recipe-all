import { Router } from 'express';
import {
  createFavorite,
  getFavorites,
  deleteFavorite,
} from '../controllers/favorite.controller.js';
const router = Router();

router.post('/', createFavorite);
router.get('/:userId', getFavorites);
router.delete('/:userId/:recipeId', deleteFavorite);

export default router;
