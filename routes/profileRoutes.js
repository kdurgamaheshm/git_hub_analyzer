import express from 'express';
import {
  analyzeProfile,
  getAllProfiles,
  getProfileByUsername,
  deleteProfile,
} from '../controllers/profileController.js';

const router = express.Router();

// Analyze and store profile details
router.post('/analyze/:username', analyzeProfile);

// Fetch all analyzed profiles
router.get('/profiles', getAllProfiles);

// Fetch details for a specific analyzed profile
router.get('/profiles/:username', getProfileByUsername);

// Delete profile analysis record
router.delete('/profiles/:username', deleteProfile);

export default router;
