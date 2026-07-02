-- Schema DDL for GitHub Profile Analyzer

CREATE DATABASE IF NOT EXISTS github_analyzer;
USE github_analyzer;

CREATE TABLE IF NOT EXISTS github_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(150),
  avatar_url VARCHAR(500),
  bio TEXT,
  blog VARCHAR(255),
  location VARCHAR(255),
  public_repos INT DEFAULT 0,
  public_gists INT DEFAULT 0,
  followers INT DEFAULT 0,
  following INT DEFAULT 0,
  github_created_at VARCHAR(100), -- Using string to preserve exact ISO formats from API response
  github_updated_at VARCHAR(100),
  
  -- Calculated insights
  total_stars INT DEFAULT 0,
  total_forks INT DEFAULT 0,
  primary_language VARCHAR(50),
  most_starred_repo VARCHAR(255),
  languages_json TEXT, -- Stores JSON representation of language usage count, e.g. {"JavaScript":3,"HTML":1}
  
  -- System metadata
  analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
