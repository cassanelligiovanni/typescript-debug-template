import express from 'express';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import cors from 'cors'; // Add this import
import { getMondayTasks } from './monday';
import { getFacebookAdAccounts } from './facebook';
import { getAllLeads } from './salesforce';
import { Nango, OAuth2Credentials } from '@nangohq/node';

dotenv.config();

const nango = new Nango({ secretKey: process.env.NANGO_SECRET_KEY || '' });

const MONDAY_INTEGRATION_ID = 'monday';

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:')
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
  }),
);

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Create connection
app.post('/connections', async (req, res) => {
  const { app_id, user_id } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO connections (app_id, user_id) VALUES ($1, $2) RETURNING *',
      [app_id, user_id],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating connection:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all connections for a user
app.get('/connections/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query('SELECT * FROM connections WHERE user_id = $1', [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching connections:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a connection
app.delete('/connections', async (req, res) => {
  const { app_id, user_id } = req.body;

  try {
    const result = await pool.query(
      'DELETE FROM connections WHERE app_id = $1 AND user_id = $2 RETURNING *',
      [app_id, user_id],
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Connection not found' });
    } else {
      res.json({ message: 'Connection deleted successfully' });
    }
  } catch (error) {
    console.error('Error deleting connection:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add this new endpoint
app.get('/monday/:userId/tasks', async (req, res) => {
  try {
    const { userId } = req.params;
    const tasks = await getMondayTasks(userId);
    res.json(tasks);
  } catch (error) {
    console.error('Error in /monday/:userId/tasks endpoint:', error);
    res.status(500).json({ error: 'An error occurred while fetching tasks' });
  }
});

app.get('/monday/:userId/column-values/:boardId', async (req, res) => {});

// Add this new endpoint
app.get('/facebook/:userId/adaccounts', async (req, res) => {
  try {
    const { userId } = req.params;
    const adAccounts = await getFacebookAdAccounts(userId);
    res.json(adAccounts);
  } catch (error) {
    console.error('Error in /facebook/:userId/adaccounts endpoint:', error);
    res.status(500).json({ error: 'An error occurred while fetching ad accounts' });
  }
});

app.post('/sync', async (req, res) => {
  const {
    connectionId,
    providerConfigKey,
    syncName,
    model,
    responseResults,
    syncType,
    modifiedAfter,
  } = req.body;

  console.log('Webhook received');
  try {
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).send('Error fetching tasks');
  }

  res.status(200).send('Sync started');
});

app.post('/start-sync', async (req, res) => {
  try {
    const userId = 'user-6';
    const metadata = await nango.getMetadata(MONDAY_INTEGRATION_ID, userId);
    const mappings = req.body.mappings;

    await nango.setMetadata(MONDAY_INTEGRATION_ID, userId, { ...metadata, ...mappings });
    await nango.startSync(MONDAY_INTEGRATION_ID, ['sync-tasks'], userId);
    res.status(200).send('Sync started');
  } catch (error) {
    console.error('Error starting sync:', error);
    res.status(500).send('Error starting sync');
  }
});

app.post('/pause-sync', async (req, res) => {
  try {
    const userId = 'user-6';
    await nango.pauseSync(MONDAY_INTEGRATION_ID, ['sync-tasks'], userId);
    res.status(200).send('Sync paused');
  } catch (error) {
    console.error('Error pausing sync:', error);
    res.status(500).send('Error pausing sync');
  }
});

app.get('/sync-status', async (req, res) => {
  try {
    const userId = 'user-6';
    const status = await nango.syncStatus(MONDAY_INTEGRATION_ID, ['sync-tasks'], userId);
    res.json(status);
  } catch (error) {
    console.error('Error getting sync status:', error);
    res.status(500).send('Error getting sync status');
  }
});

app.get('/airbyte', async (req, res) => {
  const connection = await nango.getConnection('asana', 'test-connection-id', true, true);

  const credentials = connection.credentials as OAuth2Credentials;
  console.log(credentials);
  // const refreshToken = credentials.refresh_token;
  // const accessToken = credentials.access_token;

  res.json();
});

app.get('/salesforce', async (req, res) => {
  const leads = await getAllLeads('audiencerate-sandbox-salesforce');

  leads.forEach((lead) => {
    console.log(
      `Lead: ${lead.Id}, ${lead.FirstName} ${lead.LastName}, Company: ${lead.Company}, Status: ${lead.Status}`,
    );
  });
  res.json(leads);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
