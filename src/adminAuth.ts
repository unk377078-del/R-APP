import { EmailAuthProvider, reauthenticateWithCredential, signInWithEmailAndPassword, signOut, updatePassword } from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase';

export const ADMIN_EMAIL = 'unk377078@gmail.com';

export async function signInAdmin(emailInput: string, password: string): Promise<void> {
  const email = emailInput.trim().toLowerCase();
  if (email !== ADMIN_EMAIL) throw new Error('هذا البريد غير مخصص لإدارة المتجر.');
  if (!isFirebaseConfigured || !auth) throw new Error('خدمة المصادقة السحابية غير مهيأة.');

  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    if (result.user.email?.toLowerCase() !== ADMIN_EMAIL) {
      await signOut(auth);
      throw new Error('هذا الحساب ليس لديه صلاحية دخول لوحة الإدارة.');
    }
    if (!result.user.emailVerified) {
      console.warn('Admin email is not verified in Firebase Auth, proceeding as matching ADMIN_EMAIL');
    }
  } catch (error: any) {
    if (error instanceof Error && (error.message.startsWith('هذا الحساب')||error.message.startsWith('يجب توثيق'))) throw error;
    switch (error?.code) {
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        throw new Error('كلمة مرور المدير غير صحيحة.');
      case 'auth/operation-not-allowed':
        throw new Error('تسجيل الدخول ببيانات الإدارة غير متاح حالياً.');
      case 'auth/too-many-requests':
        throw new Error('محاولات كثيرة. انتظر قليلاً ثم حاول مرة أخرى.');
      case 'auth/network-request-failed':
        throw new Error('تعذر الاتصال بالخادم السحابي. تحقق من الإنترنت ثم أعد المحاولة.');
      default:
        throw new Error('تعذر تسجيل دخول المدير. تحقق من البريد وكلمة المرور.');
    }
  }
}

export async function signOutAdmin(): Promise<void> {
  if (auth) await signOut(auth);
}

export async function changeAdminPassword(currentPassword: string, newPassword: string): Promise<void> {
  const user = auth?.currentUser;
  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) {
    throw new Error('سجّل دخول المدير قبل تغيير كلمة المرور.');
  }
  if (newPassword.length < 8) throw new Error('كلمة المرور الجديدة يجب أن تتكون من ٨ أحرف على الأقل.');
  try {
    const credential = EmailAuthProvider.credential(ADMIN_EMAIL, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
  } catch (error: any) {
    if (error?.code === 'auth/wrong-password' || error?.code === 'auth/invalid-credential') {
      throw new Error('كلمة المرور الحالية غير صحيحة.');
    }
    if (error?.code === 'auth/weak-password') throw new Error('اختر كلمة مرور أقوى.');
    if (error?.code === 'auth/requires-recent-login') throw new Error('انتهت جلسة التحقق. سجّل الدخول مجدداً ثم حاول.');
    throw new Error('تعذر تغيير كلمة المرور. تحقق من الاتصال ثم حاول مرة أخرى.');
  }
}
