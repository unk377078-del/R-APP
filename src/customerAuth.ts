import { createUserWithEmailAndPassword, deleteUser, EmailAuthProvider, linkWithCredential, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, firestore, functions, isFirebaseConfigured } from './firebase';

export type CustomerProfile = {
  name: string;
  contact: string;
  phone: string;
  points: number;
  documentId: string;
  loginIdentifier: string;
};

export function normalizePhone(input: string): string {
  if (!input) return '';
  const arabicDigits = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
  let cleaned = String(input).trim();
  arabicDigits.forEach((d, i) => {
    cleaned = cleaned.replace(new RegExp(d, 'g'), String(i));
  });
  cleaned = cleaned.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+20')) {
    cleaned = '0' + cleaned.slice(3);
  } else if (cleaned.startsWith('0020')) {
    cleaned = '0' + cleaned.slice(4);
  } else if (cleaned.startsWith('20') && cleaned.length === 12) {
    cleaned = '0' + cleaned.slice(2);
  }
  return cleaned;
}

export function phoneToAuthEmail(phone: string): string {
  const clean = normalizePhone(phone);
  return `${clean}@alrashidi.app`;
}

function customerDocumentIds(identifier: string): string[] {
  const trimmed = identifier.trim();
  const clean = normalizePhone(trimmed);
  const candidates = [trimmed, trimmed.toLowerCase(), clean, clean.toLowerCase()];
  if (/^20\d{10}$/.test(clean)) candidates.push(`0${clean.slice(2)}`);
  if (/^0\d{10}$/.test(clean)) candidates.push(`2${clean}`);
  if (clean) candidates.push(phoneToAuthEmail(clean));
  return [...new Set(candidates.filter(Boolean))];
}

async function readRecord(documentId: string): Promise<Record<string, unknown> | null> {
  if (!firestore) return null;
  const snapshot = await getDoc(doc(firestore, 'users', documentId));
  return snapshot.exists() ? snapshot.data() : null;
}

function asCustomerProfile(data: Record<string, unknown>, documentId: string, identifier: string): CustomerProfile | null {
  if (String(data.role ?? '').toUpperCase() !== 'CUSTOMER') return null;
  const phone = typeof data.phone === 'string' && data.phone ? normalizePhone(data.phone) : '';
  const email = typeof data.email === 'string' ? data.email : '';
  const contact = phone || (email && !email.endsWith('@alrashidi.app') ? email : identifier.trim());
  return {
    name: typeof data.name === 'string' ? data.name.trim() : '',
    contact,
    phone,
    points: typeof data.loyaltyPoints === 'number' ? data.loyaltyPoints : 0,
    documentId,
    loginIdentifier: phone || identifier.trim(),
  };
}

async function findCustomerRecord(identifier: string): Promise<{ profile: CustomerProfile; data: Record<string, unknown> } | null> {
  if (!isFirebaseConfigured || !firestore) return null;
  const signedIn = auth?.currentUser;
  if (signedIn && (!identifier || signedIn.email?.toLowerCase() === identifier.trim().toLowerCase())) {
    const data = await readRecord(signedIn.uid);
    if (data) {
      const profile = asCustomerProfile(data, signedIn.uid, identifier || signedIn.email || signedIn.uid);
      if (profile) return { profile, data };
    }
  }
  for (const documentId of customerDocumentIds(identifier)) {
    const data = await readRecord(documentId);
    if (!data) continue;
    const profile = asCustomerProfile(data, documentId, identifier);
    if (profile) return { profile, data };
  }
  return null;
}

export async function findExistingCustomer(identifier: string): Promise<CustomerProfile | null> {
  return (await findCustomerRecord(identifier))?.profile ?? null;
}

export async function signOutCustomer(): Promise<void> {
  if (auth) await signOut(auth);
}

export async function deleteCustomerAccount(): Promise<void> {
  if (!auth?.currentUser || !functions || !firestore || !isFirebaseConfigured) {
    throw new Error('يلزم تسجيل الدخول والاتصال بالخدمة السحابية لحذف الحساب.');
  }
  if (auth.currentUser.email?.toLowerCase() === 'unk377078@gmail.com') {
    throw new Error('لا يمكن حذف حساب إدارة المتجر من التطبيق.');
  }
  const remove = httpsCallable(functions, 'deleteOwnAccount');
  await remove({});
}

export async function createCustomerAccount(
  nameInput: string,
  phoneOrContactInput: string,
  passwordInput: string,
  optionalEmailInput: string = ''
): Promise<CustomerProfile> {
  if (!isFirebaseConfigured || !auth || !firestore) throw new Error('الخدمة السحابية غير مهيأة لإنشاء الحساب حالياً.');

  const name = nameInput.trim();
  const rawContact = phoneOrContactInput.trim();
  const password = passwordInput.trim();
  const optionalEmail = optionalEmailInput.trim().toLowerCase();

  if (!name) throw new Error('اكتب اسم العميل.');
  if (!rawContact) throw new Error('أدخل رقم الهاتف.');
  if (password.length < 6) throw new Error('كلمة المرور يجب ألا تقل عن ٦ أحرف.');

  let phone = '';
  let authEmail = '';

  if (rawContact.includes('@')) {
    authEmail = rawContact.toLowerCase();
    phone = normalizePhone(optionalEmailInput);
  } else {
    phone = normalizePhone(rawContact);
    if (!/^01[0125]\d{8}$/.test(phone) && !/^\d{10,14}$/.test(phone)) {
      throw new Error('أدخل رقم هاتف صحيح (مثال: 01012345678 مكون من ١١ رقماً).');
    }
    authEmail = phoneToAuthEmail(phone);
  }

  if (optionalEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(optionalEmail)) {
    throw new Error('صيغة البريد الإلكتروني غير صحيحة.');
  }

  try {
    const anonymousUser = auth.currentUser?.isAnonymous ? auth.currentUser : null;
    const credential = anonymousUser
      ? await linkWithCredential(anonymousUser, EmailAuthProvider.credential(authEmail, password))
      : await createUserWithEmailAndPassword(auth, authEmail, password);
    const documentId = credential.user.uid;
    const profileData = {
      name,
      identifier: phone || authEmail,
      email: authEmail,
      personalEmail: optionalEmail || '',
      phone: phone || '',
      role: 'CUSTOMER',
      loyaltyPoints: 0,
      defaultArea: '',
      defaultStreet: '',
      defaultBuildingInfo: '',
      createdAt: Date.now(),
      authUid: credential.user.uid,
    };

    try {
      await setDoc(doc(firestore, 'users', documentId), profileData);
    } catch {
      await deleteUser(credential.user).catch(() => {});
      throw new Error('تعذر حفظ ملف الحساب في قاعدة البيانات. لم يكتمل إنشاء الحساب.');
    }

    return {
      name,
      contact: phone || authEmail,
      phone,
      points: 0,
      documentId,
      loginIdentifier: phone || authEmail,
    };
  } catch (error: any) {
    if (error instanceof Error && (error.message.startsWith('هذا الحساب') || error.message.startsWith('تعذر حفظ') || error.message.startsWith('أدخل رقم'))) {
      throw error;
    }
    switch (error?.code) {
      case 'auth/email-already-in-use':
        throw new Error('رقم الهاتف هذا مسجل بالفعل. يمكنك تسجيل الدخول به.');
      case 'auth/invalid-email':
        throw new Error('بيانات الحساب غير صالحة. يرجى التأكد من صحة رقم الهاتف.');
      case 'auth/operation-not-allowed':
        throw new Error('تسجيل الدخول بالحساب غير متاح مؤقتاً.');
      case 'auth/weak-password':
        throw new Error('اختر كلمة مرور أقوى، من ٦ أحرف على الأقل.');
      case 'auth/network-request-failed':
        throw new Error('تعذر الاتصال بالخادم السحابي. تحقق من اتصال الإنترنت ثم أعد المحاولة.');
      default:
        throw new Error('تعذر إنشاء الحساب. حاول مرة أخرى.');
    }
  }
}

export async function signInExistingCustomer(identifierInput: string, passwordInput: string): Promise<CustomerProfile> {
  if (!isFirebaseConfigured || !firestore) throw new Error('الخدمة السحابية غير مفعلة مؤقتاً.');

  const identifier = identifierInput.trim();
  const password = passwordInput.trim();
  if (!identifier || !password) throw new Error('أدخل رقم الهاتف وكلمة المرور.');

  if (auth) {
    try {
      let authEmail = '';
      if (identifier.includes('@')) {
        authEmail = identifier.toLowerCase();
      } else {
        const cleanPhone = normalizePhone(identifier);
        authEmail = phoneToAuthEmail(cleanPhone);
      }

      const credential = await signInWithEmailAndPassword(auth, authEmail, password);
      let customerData = await readRecord(credential.user.uid);
      if (!customerData) {
        const cleanPhone = normalizePhone(identifier);
        for (const docId of customerDocumentIds(identifier)) {
          const legacyData = await readRecord(docId);
          if (legacyData && String(legacyData.role || '').toUpperCase() === 'CUSTOMER') {
            customerData = {
              ...legacyData,
              authUid: credential.user.uid,
              email: authEmail,
              identifier: cleanPhone || identifier,
              phone: legacyData.phone || cleanPhone || '',
            };
            await setDoc(doc(firestore, 'users', credential.user.uid), customerData, { merge: true });
            await deleteDoc(doc(firestore, 'users', docId)).catch(() => {});
            break;
          }
        }
      }
      const customerProfile = customerData ? asCustomerProfile(customerData, credential.user.uid, identifier) : null;
      const record = customerProfile ? { profile: customerProfile, data: customerData! } : null;
      if (!record) {
        await signOut(auth);
        throw new Error('الحساب غير موجود كعميل في قاعدة البيانات.');
      }
      if (record.data.authUid && record.data.authUid !== credential.user.uid) {
        await signOut(auth);
        throw new Error('تعذر مطابقة بيانات الحساب مع ملف العميل. يرجى التواصل مع إدارة المتجر.');
      }
      return record.profile;
    } catch (error: any) {
      await signOut(auth).catch(() => {});
      if (error instanceof Error && (error.message.startsWith('الحساب غير موجود') || error.message.startsWith('تعذر مطابقة'))) throw error;
      if (['auth/invalid-credential', 'auth/user-not-found', 'auth/wrong-password'].includes(error?.code)) {
        throw new Error('رقم الهاتف أو كلمة المرور غير صحيحة.');
      }
      if (error?.code === 'auth/network-request-failed') {
        throw new Error('تعذر الاتصال بالخادم السحابي. تحقق من اتصال الإنترنت ثم أعد المحاولة.');
      }
      throw new Error(error?.message || 'تعذر تسجيل الدخول. تحقق من بيانات الحساب.');
    }
  }

  throw new Error('هذا الحساب غير موجود أو بيانات الدخول غير صحيحة.');
}
