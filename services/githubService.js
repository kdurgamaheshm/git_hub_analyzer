import dotenv from 'dotenv';

dotenv.config();

/**
 * Fetches user profile and repository list from GitHub API and computes key insights.
 * @param {string} username - The GitHub username to analyze.
 * @returns {Promise<object>} The raw data along with analyzed metrics.
 */
export const analyzeGitHubProfile = async (username) => {
  if (!username) {
    throw new Error('Username is required');
  }

  const headers = {
    'User-Agent': 'GitHub-Profile-Analyzer-API',
    'Accept': 'application/vnd.github.v3+json',
  };

  // Add authentication header if GITHUB_TOKEN is configured in environment
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  // 1. Fetch user profile data
  const profileUrl = `https://api.github.com/users/${encodeURIComponent(username)}`;
  const profileResponse = await fetch(profileUrl, { headers });

  if (profileResponse.status === 404) {
    throw new Error('GitHub user not found');
  }

  if (!profileResponse.ok) {
    const errorDetails = await profileResponse.text();
    throw new Error(`GitHub API Error (${profileResponse.status}): ${errorDetails}`);
  }

  const profileData = await profileResponse.json();

  // 2. Fetch user repositories (Limit to 100 for standard analysis)
  const reposUrl = `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100`;
  const reposResponse = await fetch(reposUrl, { headers });

  let reposData = [];
  if (reposResponse.ok) {
    reposData = await reposResponse.json();
  } else {
    console.warn(`Could not fetch repositories for ${username}: ${reposResponse.statusText}`);
  }

  // 3. Compute Insights
  let totalStars = 0;
  let totalForks = 0;
  let mostStarredRepo = null;
  let maxStars = -1;
  const languageCounts = {};

  reposData.forEach((repo) => {
    totalStars += repo.stargazers_count || 0;
    totalForks += repo.forks_count || 0;

    // Track repository with the highest stars
    if ((repo.stargazers_count || 0) > maxStars) {
      maxStars = repo.stargazers_count;
      mostStarredRepo = repo.name;
    }

    // Accumulate programming languages
    const lang = repo.language;
    if (lang) {
      languageCounts[lang] = (languageCounts[lang] || 0) + 1;
    }
  });

  // Identify primary language (highest occurrence)
  let primaryLanguage = 'None';
  let maxLangCount = 0;
  for (const [lang, count] of Object.entries(languageCounts)) {
    if (count > maxLangCount) {
      maxLangCount = count;
      primaryLanguage = lang;
    }
  }

  return {
    username: profileData.login,
    name: profileData.name || null,
    avatar_url: profileData.avatar_url || null,
    bio: profileData.bio || null,
    blog: profileData.blog || null,
    location: profileData.location || null,
    public_repos: profileData.public_repos || 0,
    public_gists: profileData.public_gists || 0,
    followers: profileData.followers || 0,
    following: profileData.following || 0,
    github_created_at: profileData.created_at || null,
    github_updated_at: profileData.updated_at || null,
    
    // Custom Computed Metrics
    total_stars: totalStars,
    total_forks: totalForks,
    primary_language: primaryLanguage,
    most_starred_repo: mostStarredRepo || 'None',
    languages_json: JSON.stringify(languageCounts),
  };
};
