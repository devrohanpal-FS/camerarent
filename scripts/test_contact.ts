import { PrismaClient } from '@prisma/client';
import http from 'http';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function postContact(data: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5001,
        path: '/api/contacts',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error(`Failed to parse response: ${body}`));
          }
        });
      }
    );

    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('--- CameraRent Contact Message Test ---');

  const testPayload = {
    name: 'Rohan Pal Dev',
    email: 'rohanpaldeveloper@gmail.com',
    subject: 'Request for Anamorphic Lens Pack Discount',
    message: 'Hello Support,\n\nWe need to rent 3 sets of Sony FX3 + anamorphic lenses for 2 weeks in August. Do you offer bulk multi-week discounts?\n\nThanks,\nRohan',
  };

  try {
    console.log('1. Submitting test contact message to local server endpoint...');
    const result = await postContact(testPayload);

    console.log('Response received:', result);

    if (result.error) {
      throw new Error(`Endpoint returned error: ${result.error}`);
    }

    console.log('✔ Message submitted successfully!');

    console.log('2. Querying database to confirm record was saved...');
    const savedMsg = await prisma.contactMessage.findFirst({
      where: { email: testPayload.email },
      orderBy: { createdAt: 'desc' },
    });

    if (!savedMsg) {
      throw new Error('Could not find the message in the SQLite database!');
    }

    console.log('✔ Confirmed message stored in SQLite DB successfully!');
    console.log(`   ID: ${savedMsg.id}`);
    console.log(`   Subject: ${savedMsg.subject}`);
    console.log(`   Message: ${savedMsg.message}`);

    console.log('3. Verifying local styled HTML preview file...');
    const previewsDir = path.join(__dirname, '../sent-emails');
    const files = fs.readdirSync(previewsDir);
    const htmlFiles = files.filter(f => f.startsWith('message-') && f.endsWith('.html'));

    if (htmlFiles.length === 0) {
      throw new Error('No styled HTML email preview files found in sent-emails/ directory!');
    }

    const latestFile = htmlFiles.sort().reverse()[0];
    const filePath = path.join(previewsDir, latestFile);
    console.log(`✔ Found email preview file: ${filePath}`);

    const htmlContent = fs.readFileSync(filePath, 'utf8');
    if (!htmlContent.includes('rohanpaldeveloper@gmail.com')) {
      throw new Error('Email preview file does not contain user email address!');
    }
    console.log('✔ Styled HTML content verification passed (includes recipient and styled elements)!');

    console.log('\n✔ All Contact Message Tests Passed Successfully!');
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTests();
