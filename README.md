# ON-CALL

**Overview**
This script automates the management of on-call schedules by:
- Fetching active on-call schedules and participants from OpsGenie.
- Sending Slack notifications to on-call team members.
- Sending email alerts if Slack notifications fail.

**Features**
1. **OpsGenie Integration**: Fetches active on-call schedules and participants.
2. **Slack Notifications**: Sends real-time alerts to on-call responders.
3. **Email Fallback**: Sends email notifications if Slack notifications fail.

**Prerequisites**
- Node.js installed on your system.
- Access to OpsGenie API with a valid API key.
- A configured Slack Webhook URL.
- An email account for sending alerts (SMTP server details required).

**Setup**
1. Clone this repository or copy the script.
2. Install dependencies:
   ```bash
   npm install axios nodemailer dotenv
 
3. Create a `.env` file with the following variables:
 
   OPSGENIE_API_KEY=<Your OpsGenie API key>
   SLACK_WEBHOOK_URL=<Your Slack Webhook URL>
   EMAIL_HOST=<SMTP server>
   EMAIL_PORT=<SMTP port>
   EMAIL_USER=<Email username>
   EMAIL_PASS=<Email password>
   ALERT_EMAIL=<Recipient email for error alerts>
  

## How to Run
1. Save the script as `script.js`.
2. Run the script:
node script.js


