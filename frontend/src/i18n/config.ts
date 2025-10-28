import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
const resources = {
  id: {
    translation: {
      // Login Page
      login: {
        title: 'UniPresence Enterprise',
        subtitle: 'Sistem Manajemen Karyawan',
        heading: 'Login',
        employeeIdLabel: 'NIP (Nomor Induk Pegawai)',
        employeeIdPlaceholder: 'Masukkan NIP (contoh: EMP001)',
        passwordLabel: 'Password',
        passwordPlaceholder: 'Masukkan password',
        loginButton: 'Login',
        loggingIn: 'Memproses...',
        rememberMe: 'Ingat saya',
        forgotPassword: 'Lupa password?',
        testAccounts: 'Akun Test',
        admin: 'Admin',
        manager: 'Manajer',
        employee: 'Karyawan',
        errorRequired: 'NIP dan password harus diisi',
        errorInvalid: 'Login gagal. Silakan coba lagi.',
        welcome: 'Selamat datang kembali!',
        tagline: 'Masuk untuk melanjutkan ke dashboard',
      },
      // Common
      common: {
        loading: 'Memuat...',
        success: 'Berhasil',
        error: 'Kesalahan',
        cancel: 'Batal',
        save: 'Simpan',
        delete: 'Hapus',
        edit: 'Edit',
        close: 'Tutup',
      },
    },
  },
  en: {
    translation: {
      // Login Page
      login: {
        title: 'UniPresence Enterprise',
        subtitle: 'Employee Management System',
        heading: 'Login',
        employeeIdLabel: 'Employee ID',
        employeeIdPlaceholder: 'Enter Employee ID (e.g., EMP001)',
        passwordLabel: 'Password',
        passwordPlaceholder: 'Enter password',
        loginButton: 'Login',
        loggingIn: 'Processing...',
        rememberMe: 'Remember me',
        forgotPassword: 'Forgot password?',
        testAccounts: 'Test Accounts',
        admin: 'Admin',
        manager: 'Manager',
        employee: 'Employee',
        errorRequired: 'Employee ID and password are required',
        errorInvalid: 'Login failed. Please try again.',
        welcome: 'Welcome back!',
        tagline: 'Sign in to continue to dashboard',
      },
      // Common
      common: {
        loading: 'Loading...',
        success: 'Success',
        error: 'Error',
        cancel: 'Cancel',
        save: 'Save',
        delete: 'Delete',
        edit: 'Edit',
        close: 'Close',
      },
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'id',
    lng: 'id', // Default language
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
