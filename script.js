require('dotenv').config();

//Importing libraries - Axios for handling APIs and Nodemailer for sending emails
const axios = require('axios');
const nodemailer = require('nodemailer');

//Saving environment variables so I can use them later
const OPSGENIE_API_KEY = process.env.OPSGENIE_API_KEY;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

// Setting up email configurations - the details of the email I׳m using
const EMAIL_CONFIG = {
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER, // Username from the email
    pass: process.env.EMAIL_PASS, // Password from the email
  },
};
const ALERT_EMAIL = process.env.ALERT_EMAIL; //An address where alerts are sent in case of an issue

// A function for sending a message to Slack
async function sendSlackNotification(person, team) {
  try {
    // Sends a message to Slack via a Webhook
    await axios.post(SLACK_WEBHOOK_URL, {
      text: ` *On-Call Alert*\n *Responder:* ${person}\n *Team:* ${team}`,
    });
    console.log(`Slack notification sent to ${person}`);
  } catch (error) {
    // If it fails - prints an error message and sends an alert email
    console.error(`Slack notification failed for ${person}:`, error.message);
    await sendFailureEmail(error.message, person, team);
  }
}

// A function for sending an email if something fails
async function sendFailureEmail(error, person, team) {
  try {
    // Sets up an email transporter and sends an email
    await nodemailer.createTransport(EMAIL_CONFIG).sendMail({
      from: EMAIL_CONFIG.auth.user, // Sends the email
      to: ALERT_EMAIL, // Who to send the email to
      subject: 'Failed to send Slack notification', // Subject
      text: `Error: ${error}\nResponder: ${person}\nTeam: ${team}`, // The content
    });
    console.log(`Failure email sent for ${person}`);
  } catch (emailError) {
    // If the email also fails - prints an error message
    console.error('Failed to send failure email:', emailError.message);
  }
}

//The main function - manages the entire process of fetching duty data and sending alerts
async function manageOnCallNotifications() {
  try {
    // Fetches the duty roster from OpsGenie.
    const schedules = await axios.get('https://api.opsgenie.com/v2/schedules', {
      headers: { Authorization: `GenieKey ${OPSGENIE_API_KEY}` },
    }).then(res => res.data.data);

    // Checks if there is an active duty
    const activeSchedule = schedules.find(schedule => schedule.enabled);
    if (!activeSchedule) return console.log('No active on-call schedules.');

    // If there is an active duty, fetches the list of participants in the duty
    const participants = await axios.get(
      `https://api.opsgenie.com/v2/schedules/${activeSchedule.id}/on-calls`,
      { headers: { Authorization: `GenieKey ${OPSGENIE_API_KEY}` } }
    ).then(res => res.data.data.onCallParticipants);

    //Sends a Slack message to those currently on duty
    participants.forEach(p => sendSlackNotification(p.name, activeSchedule.name));
  } catch (error) {
    // If something fails, prints the error
    console.error('Failed to fetch On-Call data:', error.message);
  }
}

// Running the main function
manageOnCallNotifications();
