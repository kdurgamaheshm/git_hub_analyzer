import pool from '../config/db.js';
import { analyzeGitHubProfile } from '../services/githubService.js';

/**
 * Trigger GitHub profile analysis and store/update insights in MySQL
 * POST /api/analyze/:username
 */
export const analyzeProfile = async (req, res) => {
  const { username } = req.params;

  if (!username || username.trim() === '') {
    return res.status(400).json({ error: 'Username parameter is required' });
  }

  try {
    console.log(`Analyzing GitHub profile for username: ${username}`);
    const data = await analyzeGitHubProfile(username.trim());

    const sql = `
      INSERT INTO github_profiles (
        username, name, avatar_url, bio, blog, location, 
        public_repos, public_gists, followers, following, 
        github_created_at, github_updated_at,
        total_stars, total_forks, primary_language, most_starred_repo, languages_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        avatar_url = VALUES(avatar_url),
        bio = VALUES(bio),
        blog = VALUES(blog),
        location = VALUES(location),
        public_repos = VALUES(public_repos),
        public_gists = VALUES(public_gists),
        followers = VALUES(followers),
        following = VALUES(following),
        github_updated_at = VALUES(github_updated_at),
        total_stars = VALUES(total_stars),
        total_forks = VALUES(total_forks),
        primary_language = VALUES(primary_language),
        most_starred_repo = VALUES(most_starred_repo),
        languages_json = VALUES(languages_json),
        analyzed_at = CURRENT_TIMESTAMP
    `;

    const values = [
      data.username,
      data.name,
      data.avatar_url,
      data.bio,
      data.blog,
      data.location,
      data.public_repos,
      data.public_gists,
      data.followers,
      data.following,
      data.github_created_at,
      data.github_updated_at,
      data.total_stars,
      data.total_forks,
      data.primary_language,
      data.most_starred_repo,
      data.languages_json
    ];

    await pool.query(sql, values);

    // Return the analyzed object (with parsed languages_json)
    const formattedData = {
      ...data,
      languages_json: JSON.parse(data.languages_json)
    };

    return res.status(200).json({
      message: `Profile analysis for '${username}' successfully stored/updated.`,
      data: formattedData
    });

  } catch (error) {
    console.error(`Error analyzing profile for ${username}:`, error.message);
    if (error.message === 'GitHub user not found') {
      return res.status(404).json({ error: `GitHub user '${username}' not found` });
    }
    return res.status(500).json({
      error: 'Failed to analyze GitHub profile',
      details: error.message
    });
  }
};

/**
 * Fetch all stored profile analysis summaries
 * GET /api/profiles
 */
export const getAllProfiles = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM github_profiles ORDER BY analyzed_at DESC');
    
    // Parse the JSON string representation of languages for each row
    const formattedRows = rows.map(row => ({
      ...row,
      languages_json: row.languages_json ? JSON.parse(row.languages_json) : {}
    }));

    return res.status(200).json({
      count: formattedRows.length,
      profiles: formattedRows
    });
  } catch (error) {
    console.error('Error fetching profiles:', error.message);
    return res.status(500).json({
      error: 'Failed to fetch stored profile lists',
      details: error.message
    });
  }
};

/**
 * Fetch the analysis data for a single profile
 * GET /api/profiles/:username
 */
export const getProfileByUsername = async (req, res) => {
  const { username } = req.params;

  try {
    const [rows] = await pool.query('SELECT * FROM github_profiles WHERE username = ?', [username]);

    if (rows.length === 0) {
      return res.status(404).json({
        error: `Profile analysis for '${username}' has not been stored.`,
        suggestion: `Please make a POST request to /api/analyze/${username} first.`
      });
    }

    const profile = rows[0];
    profile.languages_json = profile.languages_json ? JSON.parse(profile.languages_json) : {};

    return res.status(200).json({
      success: true,
      profile
    });
  } catch (error) {
    console.error(`Error fetching profile ${username}:`, error.message);
    return res.status(500).json({
      error: `Failed to fetch profile metadata for ${username}`,
      details: error.message
    });
  }
};

/**
 * Delete a profile analysis record
 * DELETE /api/profiles/:username
 */
export const deleteProfile = async (req, res) => {
  const { username } = req.params;

  try {
    const [result] = await pool.query('DELETE FROM github_profiles WHERE username = ?', [username]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: `No profile found for '${username}' to delete.` });
    }

    return res.status(200).json({
      message: `Profile analysis for '${username}' successfully deleted from local storage.`
    });
  } catch (error) {
    console.error(`Error deleting profile ${username}:`, error.message);
    return res.status(500).json({
      error: `Failed to delete profile for ${username}`,
      details: error.message
    });
  }
};
