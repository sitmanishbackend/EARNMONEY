const notifyHelper = async ({ user_id = null, title, message = '', type = 'system', link = null }, Notification) => {
  try {
    await Notification.create({ user_id, title, message, type, link });
  } catch (e) {
    console.error('[Notify] Failed to create notification:', e.message);
  }
};
 
module.exports = { notifyHelper };
 