const crypto = require('node:crypto');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { FieldValue, getFirestore } = require('firebase-admin/firestore');
const { HttpsError, onCall, onRequest } = require('firebase-functions/v2/https');

initializeApp();
const db = getFirestore();
const adminEmail = 'unk377078@gmail.com';

exports.deleteOwnAccount = onCall({ region: 'us-central1' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'سجّل الدخول أولاً.');
  if ((request.auth.token.email || '').toLowerCase() === adminEmail) {
    throw new HttpsError('permission-denied', 'لا يمكن حذف حساب إدارة المتجر بهذه الطريقة.');
  }

  const uid = request.auth.uid;
  const userCollection = db.collection('users');
  const email = String(request.auth.token.email || '').toLowerCase();
  const [authUidUsers, emailUsers] = await Promise.all([
    userCollection.where('authUid', '==', uid).get(),
    email ? userCollection.where('email', '==', email).get() : Promise.resolve({ docs: [] }),
  ]);
  const ownedOrders = await db.collection('orders').where('ownerUid', '==', uid).get();
  const ownedNotifications = await db.collection('notifications').where('ownerUid', '==', uid).get();
  const targetedPromotions = await db.collection('promotional_broadcasts').where('eligibleCustomerIds', 'array-contains', uid).get();
  const orderDocs = ownedOrders.docs;
  for (let offset = 0; offset < orderDocs.length; offset += 400) {
    const batch = db.batch();
    for (const order of orderDocs.slice(offset, offset + 400)) {
      batch.update(order.ref, {
        ownerUid: FieldValue.delete(),
        customerDocumentId: '',
        customerName: 'عميل محذوف',
        customerPhone: FieldValue.delete(),
        customerEmail: FieldValue.delete(),
        area: FieldValue.delete(),
        street: FieldValue.delete(),
        buildingInfo: FieldValue.delete(),
        formattedAddress: FieldValue.delete(),
        latitude: FieldValue.delete(),
        longitude: FieldValue.delete(),
        generalNotes: FieldValue.delete(),
        updatedAt: Date.now(),
      });
    }
    await batch.commit();
  }

  await db.collection('user_app_state').doc(uid).delete();
  const userDocs = new Map([...authUidUsers.docs, ...emailUsers.docs].map((item) => [item.ref.path, item.ref]));
  for (const userRef of userDocs.values()) await userRef.delete();
  for (let offset = 0; offset < ownedNotifications.docs.length; offset += 400) {
    const batch = db.batch();
    for (const notice of ownedNotifications.docs.slice(offset, offset + 400)) batch.delete(notice.ref);
    await batch.commit();
  }
  for (const promotion of targetedPromotions.docs) {
    const remaining = (promotion.data().eligibleCustomerIds || []).filter((customerId) => customerId !== uid);
    await promotion.ref.update({ eligibleCustomerIds: remaining });
  }
  await getAuth().deleteUser(uid);
  return { success: true };
});

exports.requestAccountDeletion = onRequest({
  region: 'us-central1',
  cors: true,
  invoker: 'public',
}, async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'استخدم POST لإرسال طلب الحذف.' });
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'أدخل بريدًا إلكترونيًا صحيحًا.' });
  }
  const id = crypto.createHash('sha256').update(email).digest('hex');
  const ref = db.collection('account_deletion_requests').doc(id);
  const previous = await ref.get();
  if (!previous.exists || Date.now() - Number(previous.data().requestedAt || 0) > 24 * 60 * 60 * 1000) {
    await ref.set({ email, requestedAt: Date.now(), status: 'pending', source: 'web' }, { merge: true });
  }
  return res.status(202).json({ message: 'وصل طلبك. سيتواصل معك فريق المتجر للتحقق وإتمام حذف الحساب.' });
});
