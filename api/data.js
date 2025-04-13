import fs from 'fs';
import path from 'path';

const dataDir = path.resolve(process.cwd(), 'data');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Ensure file exists with initial JSON
function ensureFile(file) {
  const filePath = path.join(dataDir, file);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
  }
  return filePath;
}

// Load data from a file
function loadData(file) {
  const filePath = ensureFile(file);
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

// Save data to a file with optional unique key
function saveData(file, newData, uniqueKey) {
  const filePath = ensureFile(file);
  let currentData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  if (uniqueKey && newData[uniqueKey]) {
    currentData = currentData.filter(item => item[uniqueKey] !== newData[uniqueKey]);
  }

  currentData.push(newData);
  fs.writeFileSync(filePath, JSON.stringify(currentData, null, 2));
}

// Save config directly
function saveConfig(data) {
  const configPath = path.join(dataDir, 'config.json');
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
}

// Load config
function loadConfig() {
  const configPath = path.join(dataDir, 'config.json');
  if (!fs.existsSync(configPath)) return {};
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

export default async function handler(req, res) {
  const { method } = req;

  if (method === 'POST') {
    const body = req.body;

    if (!body || !body.type || !body.data) {
      return res.status(400).json({ status: 'error', message: 'Invalid JSON input or missing fields' });
    }

    const { type, data } = body;

    switch (type) {
      case 'video':
        saveData('videos.json', data, 'file_id');
        return res.json({ status: 'success', message: 'Video saved' });
      case 'user':
        saveData('users.json', data, 'user_id');
        return res.json({ status: 'success', message: 'User saved' });
      case 'group':
        saveData('groups.json', data, 'group_id');
        return res.json({ status: 'success', message: 'Group saved' });
      case 'config':
        saveConfig(data);
        return res.json({ status: 'success', message: 'Config saved' });
      default:
        return res.status(400).json({ status: 'error', message: 'Invalid data type' });
    }
  }

  if (method === 'GET') {
    const { type } = req.query;

    switch (type) {
      case 'video':
        return res.json({ status: 'success', message: 'Videos loaded', data: loadData('videos.json') });
      case 'user':
        return res.json({ status: 'success', message: 'Users loaded', data: loadData('users.json') });
      case 'group':
        return res.json({ status: 'success', message: 'Groups loaded', data: loadData('groups.json') });
      case 'config':
        return res.json({ status: 'success', message: 'Config loaded', data: loadConfig() });
      default:
        return res.status(400).json({ status: 'error', message: 'Invalid data type' });
    }
  }

  return res.status(405).json({ status: 'error', message: 'Invalid request method' });
}
