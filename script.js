require('dotenv').config();

// מייבא ספריות - Axios לטיפול ב-API ו-Nodemailer בשביל לשלוח מיילים
const axios = require('axios');
const nodemailer = require('nodemailer');

// שומרת משתני סביבה כדי שאוכל להשתמש בהם בהמשך
const OPSGENIE_API_KEY = process.env.OPSGENIE_API_KEY;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

// מגדירה הגדרות לדוא"ל - הפרטים של המייל שאני משתמשת בו
const EMAIL_CONFIG = {
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER, // שם משתמש מהמייל
    pass: process.env.EMAIL_PASS, // סיסמה מהמייל
  },
};
const ALERT_EMAIL = process.env.ALERT_EMAIL; // כתובת שאליה נשלחות התראות במקרה של בעיה

// פונקציה לשליחת הודעה ל-Slack
async function sendSlackNotification(person, team) {
  try {
    // שולח הודעה ל-Slack דרך Webhook
    await axios.post(SLACK_WEBHOOK_URL, {
      text: ` *On-Call Alert*\n *Responder:* ${person}\n *Team:* ${team}`,
    });
    console.log(`Slack notification sent to ${person}`);
  } catch (error) {
    // אם נכשל - מדפיס הודעת שגיאה ושולח מייל התראה
    console.error(`Slack notification failed for ${person}:`, error.message);
    await sendFailureEmail(error.message, person, team);
  }
}

// פונקציה לשליחת מייל אם משהו נכשל
async function sendFailureEmail(error, person, team) {
  try {
    // מגדיר טרנספורטר לדוא"ל ושולח מייל
    await nodemailer.createTransport(EMAIL_CONFIG).sendMail({
      from: EMAIL_CONFIG.auth.user, // שולח את המייל
      to: ALERT_EMAIL, // למי לשלוח את המייל
      subject: 'Failed to send Slack notification', // כותרת
      text: `Error: ${error}\nResponder: ${person}\nTeam: ${team}`, // התוכן
    });
    console.log(`Failure email sent for ${person}`);
  } catch (emailError) {
    // אם גם המייל נכשל - מדפיס הודעת שגיאה
    console.error('Failed to send failure email:', emailError.message);
  }
}

// הפונקציה הראשית - מנהלת את כל התהליך של משיכת נתוני התורנויות ושליחת ההתראות
async function manageOnCallNotifications() {
  try {
    // מושך את רשימת התורנויות מ-OpsGenie
    const schedules = await axios.get('https://api.opsgenie.com/v2/schedules', {
      headers: { Authorization: `GenieKey ${OPSGENIE_API_KEY}` },
    }).then(res => res.data.data);

    // בודק אם יש תורנות פעילה
    const activeSchedule = schedules.find(schedule => schedule.enabled);
    if (!activeSchedule) return console.log('No active on-call schedules.');

    // אם יש תורנות פעילה, מושך את רשימת המשתתפים בתורנות
    const participants = await axios.get(
      `https://api.opsgenie.com/v2/schedules/${activeSchedule.id}/on-calls`,
      { headers: { Authorization: `GenieKey ${OPSGENIE_API_KEY}` } }
    ).then(res => res.data.data.onCallParticipants);

    // שולח הודעה ל-Slack לכל משתתף בתורנות
    participants.forEach(p => sendSlackNotification(p.name, activeSchedule.name));
  } catch (error) {
    // אם משהו נכשל, מדפיס את השגיאה
    console.error('Failed to fetch On-Call data:', error.message);
  }
}

// הרצת הפונקציה הראשית
manageOnCallNotifications();
