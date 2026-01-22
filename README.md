# Medicare Prescriber Search App

Search Medicare Part D prescriber data by NPI or drug name.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Deploy Amplify backend:
```bash
npx ampx sandbox
```

3. Import CSV data:
   - Upload `MUP_DPR_RY25_P04_V10_DY23_NPIBN.csv` to S3 bucket created by Amplify
   - Configure S3 trigger for the csv-importer Lambda function
   - Or use AWS CLI:
```bash
aws s3 cp C:\Users\cpeck\MUP_DPR_RY25_P04_V10_DY23_NPIBN.csv s3://YOUR-BUCKET/
```

4. Run the app:
```bash
npm run dev
```

Open http://localhost:3000

## Features

- Search medications by prescriber NPI
- Find top prescribers for any drug
- View claims, costs, and beneficiary counts

## Data Import Alternative

For faster import, split the CSV and run parallel imports:
```bash
split -l 1000000 MUP_DPR_RY25_P04_V10_DY23_NPIBN.csv chunk_
```

Then upload each chunk to trigger Lambda processing.
