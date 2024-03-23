import express from 'express';
import { createClient } from '@supabase/supabase-js';
import bodyParser from "body-parser";
import dotenv from 'dotenv';

const app = express();

app.use(bodyParser.json({limit: '50mb'}));

dotenv.config({ path: './.env' });

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.PUBLIC_SUPABASE_KEY);

function epochToJsDate(timestamp){
  return new Date(timestamp*1000).toISOString();
}

async function insertData(req_data) {
  const { data, error } = await supabase
    .from('raw_transactions')
    .insert([
      { 
        transaction_data: req_data
      }
    ])
  .select()
  if (error) {
    console.error('Error inserting data:', error);
    return;
  }  
  console.log(data)
}

app.post("/api/stx-transfer-payload", (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send({ message: 'Only POST requests allowed' })
      return
  }
  {
    insertData(req.body)
    res.status(200).json({ message: 'Hello from STX Whales'})
  }
});

app.listen(3000, () => console.log("Server ready on port 3000."));
