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

async function insertData(values) {
  const { data, error } = await supabase
    .from('transactions')
    .insert([
      { 
        block: values.block, 
        tx_timestamp: values.tx_timestamp,
        tx_id: values.tx_id,
        sender: values.sender,
        recipient: values.recipient,
        amount: values.amount,
        event_type: values.event_type,
        status: values.status 
      }
    ])
  .select()
  if (error) {
    console.error('Error inserting data:', error);
    return;
  }  
}

app.post("/api/stx-transfer-payload", (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send({ message: 'Only POST requests allowed' })
      return
  }
  {
    req.body["apply"].forEach(applyArrayElement => {
      // Ensure there is a sub-array to process.
      if (applyArrayElement["transactions"] && Array.isArray(applyArrayElement["transactions"])) {
        // Iterate over each element in the sub-array.
        applyArrayElement["transactions"].forEach(transactionArrayElement => {
          // Check to confirm transaction was success
          if (transactionArrayElement["metadata"]["success"]) {
            // Ensure there is a sub-array to process.
            // Iterate over each element in the sub-array.
            if (transactionArrayElement["metadata"]["receipt"]["events"] && Array.isArray(transactionArrayElement["metadata"]["receipt"]["events"])) {
              transactionArrayElement["metadata"]["receipt"]["events"].forEach(eventArrayElement => {
                // Ensure there is a sub-array to process.
                if (parseInt(eventArrayElement["data"]["amount"]) > 10000000000 && eventArrayElement["type"] === "STXTransferEvent") {
                  // Prepare values from both the main array element and the sub-array elements.
                  // Example: Adjust properties based on your actual data structure.
                  const values = {
                    block: applyArrayElement["block_identifier"]["index"], 
                    tx_timestamp: epochToJsDate(applyArrayElement["timestamp"]),
                    tx_id: transactionArrayElement["transaction_identifier"]["hash"], 
                    sender: eventArrayElement["data"]["sender"], 
                    recipient: eventArrayElement["data"]["recipient"],
                    amount: eventArrayElement["data"]["amount"],
                    event_type: eventArrayElement["type"],
                    status: transactionArrayElement["metadata"]["success"] 
                  };
                  insertData(values)
                }                 
              });
            }
          }
        });
      } 
    });
    res.status(200).json({ message: 'Hello from STX Whales'})
  }
});

app.listen(3000, () => console.log("Server ready on port 3000."));
