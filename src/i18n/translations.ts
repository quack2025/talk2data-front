export type Language = 'es' | 'en';

export const translations = {
  es: {
    // Auth page
    auth: {
      welcomeBack: 'Bienvenido de vuelta',
      createAccount: 'Crea tu cuenta',
      enterCredentials: 'Ingresa tus credenciales para continuar',
      startAnalyzing: 'Comienza a analizar datos con IA',
      continueWithGoogle: 'Continuar con Google',
      orContinueWithEmail: 'O continúa con email',
      email: 'Email',
      emailPlaceholder: 'tu@email.com',
      password: 'Contraseña',
      passwordPlaceholder: '••••••••',
      forgotPassword: '¿Olvidaste tu contraseña?',
      signIn: 'Iniciar sesión',
      signUp: 'Crear cuenta',
      noAccount: '¿No tienes cuenta?',
      hasAccount: '¿Ya tienes cuenta?',
      register: 'Regístrate',
      login: 'Inicia sesión',
      accountCreated: '¡Cuenta creada!',
      checkEmail: 'Revisa tu email para confirmar tu cuenta.',
      error: 'Error',
      genericError: 'Ha ocurrido un error',
      invalidEmail: 'Email inválido',
      passwordMinLength: 'La contraseña debe tener al menos 6 caracteres',
    },
    // Hero section
    hero: {
      title: 'Transforma datos en insights',
      description: 'Sube tus archivos SPSS y conversa con tus datos usando inteligencia artificial. Obtén análisis estadísticos y reportes profesionales en segundos.',
      features: ['Análisis con IA', 'Exporta PDFs', 'Chat Natural', 'SPSS nativo'],
    },
  },
  en: {
    // Auth page
    auth: {
      welcomeBack: 'Welcome back',
      createAccount: 'Create your account',
      enterCredentials: 'Enter your credentials to continue',
      startAnalyzing: 'Start analyzing data with AI',
      continueWithGoogle: 'Continue with Google',
      orContinueWithEmail: 'Or continue with email',
      email: 'Email',
      emailPlaceholder: 'you@email.com',
      password: 'Password',
      passwordPlaceholder: '••••••••',
      forgotPassword: 'Forgot your password?',
      signIn: 'Sign in',
      signUp: 'Create account',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
      register: 'Sign up',
      login: 'Sign in',
      accountCreated: 'Account created!',
      checkEmail: 'Check your email to confirm your account.',
      error: 'Error',
      genericError: 'An error occurred',
      invalidEmail: 'Invalid email',
      passwordMinLength: 'Password must be at least 6 characters',
    },
    // Hero section
    hero: {
      title: 'Transform data into insights',
      description: 'Upload your SPSS files and chat with your data using artificial intelligence. Get statistical analysis and professional reports in seconds.',
      features: ['AI Analysis', 'Export PDFs', 'Natural Chat', 'Native SPSS'],
    },
  },
} as const;

// Use a more flexible type for translations
export interface TranslationKeys {
  auth: {
    welcomeBack: string;
    createAccount: string;
    enterCredentials: string;
    startAnalyzing: string;
    continueWithGoogle: string;
    orContinueWithEmail: string;
    email: string;
    emailPlaceholder: string;
    password: string;
    passwordPlaceholder: string;
    forgotPassword: string;
    signIn: string;
    signUp: string;
    noAccount: string;
    hasAccount: string;
    register: string;
    login: string;
    accountCreated: string;
    checkEmail: string;
    error: string;
    genericError: string;
    invalidEmail: string;
    passwordMinLength: string;
  };
  hero: {
    title: string;
    description: string;
    features: readonly string[];
  };
}
