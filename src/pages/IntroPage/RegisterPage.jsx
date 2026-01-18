import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "./Artwork/registerLogo.png";
import "./RegisterPage.css";

const RegisterPage = ({ setToken }) => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [error, setError] = useState("");

  // ───────── Location
  const [country, setCountry] = useState("CO");
  const [language, setLanguage] = useState("en-US");

  // ───────── Appearance (optional)
  const [themeMode, setThemeMode] = useState("light");

  // ───────── Personal
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [gender, setGender] = useState("");

  // ───────── Account
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  // ───────── Security
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ───────── Agreements
  const [privacyPolicy, setPrivacyPolicy] = useState(false);
  const [cookies, setCookies] = useState(false);
  const [notifications, setNotifications] = useState(false);

  // ─────────────────────────────
  // VALIDATION
  // ─────────────────────────────
  const validateStep = () => {
    setError("");

    if (step === 2) {
      if (!country || !language)
        return setError("selectRegionLanguage");
    }

    if (step === 4) {
      if (!firstName || !birthMonth || !birthDate || !birthYear || !gender)
        return setError("completePersonalInfo");
    }

    if (step === 5) {
      if (!username || !email)
        return setError("completeAccountInfo");

      if (!/^[a-z0-9._]{1,20}$/.test(username))
        return setError(
          "usernameInvalid"
        );

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return setError("emailInvalid");
    }

    if (step === 6) {
      if (!password || !confirmPassword)
        return setError("passwordInvalid");

      if (!/^(?=.*[0-9]).{6,}$/.test(password))
        return setError(
          "passwordInvalid"
        );

      if (password !== confirmPassword)
        return setError("passwordMismatch");
    }

    if (step === 7) {
      if (!privacyPolicy)
        return setError("privacyPolicyRequired");
    }

    return true;
  };

  const nextStep = () => validateStep() && setStep(step + 1);
  const prevStep = () => {
    setError("");
    setStep(step - 1);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const renderPasswordToggle = () => password ? (
    <span className="toggle-registerPage" onClick={togglePasswordVisibility}>
      {showPassword ? translations[language].security.hide : translations[language].security.show}
    </span>
  ) : null;

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const renderConfirmPasswordToggle = () => confirmPassword ? (
    <span className="toggle-registerPage" onClick={toggleConfirmPasswordVisibility}>
      {showConfirmPassword ? translations[language].security.hide : translations[language].security.show}
    </span>
  ) : null;

  // ─────────────────────────────
  // SUBMIT
  // ─────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;

    try {
      const res = await fetch(
        "https://lancherixstudio-backend.onrender.com/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username,
            email,
            firstName,
            lastName,
            month: birthMonth,
            date: birthDate,
            year: birthYear,
            gender,
            country,
            language,
            themeMode,
            agreements: {
              privacyPolicy,
              cookies,
              notifications
            },
            password,
            confirmPassword
          })
        }
      );

      if (!res.ok) {
        const data = await res.json();
        return setError(data.message || "registrationFailed");
      }

      // Auto-login
      const login = await fetch(
        "https://lancherixstudio-backend.onrender.com/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: username, password })
        }
      );

      const loginData = await login.json();
      localStorage.setItem("token", loginData.token);
      setToken(loginData.token);
      navigate("/");
    } catch (err) {
      console.error(err);
      setError("serverError");
    }
  };

  // ─────────────────────────────
  // Translations
  // ─────────────────────────────
  const translations = {
    "en-US": {
      appearance: { title: "Choose a Theme", description: "This can be changed later in settings." },
      personal: {
        title: "Personal Information",
        description: "This helps us personalize your experience.",
        firstNamePlaceholder: "First name",
        lastNamePlaceholder: "Last name (optional)",
        birthdayLabel: "Birthday",
        month: "Month",
        day: "Day",
        year: "Year",
        gender: "Gender",
        male: "Male",
        female: "Female",
        preferNotToSay: "Prefer not to say"
      },
      account: {
        title: "Identity & Contact",
        description: "Select a unique username and email.",
        usernamePlaceholder: "Username",
        emailPlaceholder: "Email"
      },
      security: {
        title: "Secure your Account",
        description: "This helps keep your account information safe.",
        passwordPlaceholder: "Password",
        confirmPasswordPlaceholder: "Confirm Password",
        show: "Show",
        hide: "Hide"
      },
      agreements: {
        title: "Privacy & Preferences",
        description: "Consent and communication preferences.",
        privacy: "I agree to the Privacy Policy",
        cookies: "Allow Cookies",
        notifications: "Receive Notifications"
      },
      buttons: { start: "Start", next: "Next", back: "Back", create: "Create" },
      alreadyHaveAccount: "Already have an Account? ",
      signIn: "Sign In",
      theme: { light: "Light", dark: "Dark", glass: "Glass" },
      errors: {
        selectRegionLanguage: "Please select your country and language.",
        completePersonalInfo: "Please complete all required personal details.",
        completeAccountInfo: "Please fill out account details.",
        usernameInvalid: "Username must be 1–20 characters and use lowercase letters, numbers, dots, or underscores.",
        emailInvalid: "Invalid email format.",
        enterPassword: "Please enter your password.",
        passwordInvalid: "Password must be at least 6 characters long and contain a number.",
        passwordMismatch: "Passwords do not match.",
        privacyPolicyRequired: "You must agree to the Privacy Policy.",
        registrationFailed: "Registration failed",
        serverError: "Server error",
        usernameOrEmailTaken: "Your username or email is already taken."
      }
    },
    "es-CO": {
      appearance: { title: "Elige un Tema", description: "Esto se puede cambiar más tarde." },
      personal: {
        title: "Información Personal",
        description: "Esto nos ayuda a personalizar tu experiencia.",
        firstNamePlaceholder: "Nombre",
        lastNamePlaceholder: "Apellido (opcional)",
        birthdayLabel: "Cumpleaños",
        month: "Mes",
        day: "Día",
        year: "Año",
        gender: "Género",
        male: "Masculino",
        female: "Femenino",
        preferNotToSay: "Prefiero no decirlo"
      },
      account: {
        title: "Identidad y Contacto",
        description: "Selecciona un nombre de usuario único.",
        usernamePlaceholder: "Nombre de usuario",
        emailPlaceholder: "Correo electrónico"
      },
      security: {
        title: "Asegura tu Cuenta",
        description: "Esto ayuda a mantener tu información segura.",
        passwordPlaceholder: "Contraseña",
        confirmPasswordPlaceholder: "Confirmar Contraseña",
        show: "Mostrar",
        hide: "Ocultar"
      },
      agreements: {
        title: "Privacidad y Preferencias",
        description: "Consentimiento y preferencias de comunicación.",
        privacy: "Acepto la Política de Privacidad",
        cookies: "Permitir Cookies",
        notifications: "Recibir Notificaciones"
      },
      buttons: { start: "Comenzar", next: "Siguiente", back: "Atrás", create: "Crear" },
      alreadyHaveAccount: "¿Ya tienes una cuenta? ",
      signIn: "Iniciar sesión",
      theme: { light: "Claro", dark: "Oscuro", glass: "Vidrio" },
      errors: {
        selectRegionLanguage: "Por favor selecciona tu país y idioma.",
        completePersonalInfo: "Por favor completa todos los datos personales requeridos.",
        completeAccountInfo: "Por favor completa los detalles de la cuenta.",
        usernameInvalid: "El nombre de usuario debe tener 1–20 caracteres y usar letras minúsculas, números, puntos o guiones bajos.",
        emailInvalid: "Formato de correo inválido.",
        enterPassword: "Por favor ingresa tu contraseña.",
        passwordInvalid: "La contraseña debe tener al menos 6 caracteres y contener un número.",
        passwordMismatch: "Las contraseñas no coinciden.",
        privacyPolicyRequired: "Debes aceptar la Política de Privacidad.",
        registrationFailed: "Error al registrar",
        serverError: "Error del servidor",
        usernameOrEmailTaken: "Tu nombre de usuario o correo ya está en uso."
      }
    },
    "fr-FR": {
      appearance: { title: "Choisir un Thème", description: "Cela peut être modifié plus tard." },
      personal: {
        title: "Informations Personnelles",
        description: "Cela nous aide à personnaliser votre expérience.",
        firstNamePlaceholder: "Prénom",
        lastNamePlaceholder: "Nom (optionnel)",
        birthdayLabel: "Anniversaire",
        month: "Mois",
        day: "Jour",
        year: "Année",
        gender: "Genre",
        male: "Homme",
        female: "Femme",
        preferNotToSay: "Préfère ne pas dire"
      },
      account: {
        title: "Identité & Contact",
        description: "Choisissez un nom d'utilisateur unique.",
        usernamePlaceholder: "Nom d'utilisateur",
        emailPlaceholder: "E-mail"
      },
      security: {
        title: "Sécurisez votre Compte",
        description: "Cela permet de protéger votre compte.",
        passwordPlaceholder: "Mot de passe",
        confirmPasswordPlaceholder: "Confirmer le mot de passe",
        show: "Afficher",
        hide: "Masquer"
      },
      agreements: {
        title: "Confidentialité & Préférences",
        description: "Consentement et préférences de communication.",
        privacy: "J'accepte la politique de confidentialité",
        cookies: "Autoriser les cookies",
        notifications: "Recevoir des notifications"
      },
      buttons: { start: "Commencer", next: "Suivant", back: "Retour", create: "Créer" },
      alreadyHaveAccount: "Vous avez déjà un compte ? ",
      signIn: "Se connecter",
      theme: { light: "Clair", dark: "Sombre", glass: "Verre" },
      errors: {
        selectRegionLanguage: "Veuillez sélectionner votre pays et votre langue.",
        completePersonalInfo: "Veuillez compléter toutes les informations personnelles requises.",
        completeAccountInfo: "Veuillez remplir les informations du compte.",
        usernameInvalid: "Le nom d'utilisateur doit comporter 1 à 20 caractères et utiliser des lettres minuscules, chiffres, points ou underscores.",
        emailInvalid: "Format de l'e-mail invalide.",
        enterPassword: "Veuillez entrer votre mot de passe.",
        passwordInvalid: "Le mot de passe doit contenir au moins 6 caractères et un chiffre.",
        passwordMismatch: "Les mots de passe ne correspondent pas.",
        privacyPolicyRequired: "Vous devez accepter la politique de confidentialité.",
        registrationFailed: "Échec de l'inscription",
        serverError: "Erreur du serveur",
        usernameOrEmailTaken: "Votre nom d'utilisateur ou e-mail est déjà utilisé.",
      }
    }
  };

  // ─────────────────────────────
  // UI
  // ─────────────────────────────
  return (
    <div className="all-registerPage">
      <div className="main-registerPage">
        <img src={Logo} alt="Lancherix" />

        <form onSubmit={handleSubmit}>
          {/* STEP 1 — LOCATION */}
          {step === 1 && (
            <>
              <div className="intro-registerPage">
                <svg id="Layer_2" data-name="Layer 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440.69 156.67">
                  <path class="cls-1" d="M166.52,43.77h0c29.73,0,53.83,24.1,53.83,53.83h0c0,29.73-24.1,53.84-53.83,53.84h0c-29.73,0-53.84-24.1-53.84-53.83h0c0-29.73,24.1-53.84,53.84-53.84Z" />
                  <path class="cls-1" d="M274.18,5h0c29.73,0,53.83,24.1,53.83,53.83h0c0,29.73-24.1,53.83-53.83,53.83h0c-29.73,0-53.83-24.1-53.83-53.83h0c0-29.73,24.1-53.83,53.83-53.83Z" />
                  <rect class="cls-1" x="328.02" y="43.77" width="107.67" height="107.67" rx="53.83" ry="53.83" />
                  <g>
                    <path class="cls-2" d="M58.84,0C26.4,0,0,26.39,0,58.84s26.39,58.84,58.84,58.84,58.84-26.39,58.84-58.84S91.29,0,58.84,0ZM58.84,107.67c-26.93,0-48.84-21.91-48.84-48.84S31.91,9.99,58.84,9.99s48.84,21.91,48.84,48.84-21.91,48.84-48.84,48.84Z" />
                    <circle class="cls-2" cx="58.84" cy="42.64" r="16.2" />
                    <path class="cls-2" d="M58.84,66.96c-12.68,0-23.9,6.25-30.76,15.83,7.14,9.15,18.26,15.04,30.76,15.04s23.62-5.89,30.76-15.04c-6.86-9.58-18.08-15.83-30.76-15.83Z" />
                  </g>
                  <g>
                    <path class="cls-2" d="M166.51,38.99c-32.44,0-58.84,26.39-58.84,58.84s26.39,58.84,58.84,58.84,58.84-26.39,58.84-58.84-26.39-58.84-58.84-58.84h0ZM166.51,146.67c-26.93,0-48.84-21.91-48.84-48.84s21.91-48.84,48.84-48.84,48.84,21.91,48.84,48.84-21.91,48.84-48.84,48.84Z" />
                    <circle class="cls-2" cx="166.51" cy="81.63" r="16.2" />
                    <path class="cls-2" d="M166.51,105.96c-12.68,0-23.9,6.25-30.76,15.83,7.14,9.15,18.26,15.04,30.76,15.04s23.62-5.89,30.76-15.04c-6.86-9.58-18.08-15.83-30.76-15.83h0Z" />
                  </g>
                  <g>
                    <path class="cls-2" d="M274.18,0c-32.44,0-58.84,26.39-58.84,58.84s26.39,58.84,58.84,58.84,58.84-26.39,58.84-58.84S306.63,0,274.18,0ZM274.18,107.67c-26.93,0-48.84-21.91-48.84-48.84s21.91-48.84,48.84-48.84,48.84,21.91,48.84,48.84-21.91,48.84-48.84,48.84Z" />
                    <circle class="cls-2" cx="274.18" cy="42.64" r="16.2" />
                    <path class="cls-2" d="M274.18,66.96c-12.68,0-23.9,6.25-30.76,15.83,7.14,9.15,18.26,15.04,30.76,15.04s23.62-5.89,30.76-15.04c-6.86-9.58-18.08-15.83-30.76-15.83Z" />
                  </g>
                  <g>
                    <path class="cls-2" d="M381.85,38.77c-32.44,0-58.84,26.39-58.84,58.84s26.39,58.84,58.84,58.84,58.84-26.39,58.84-58.84-26.39-58.84-58.84-58.84h0ZM381.85,146.44c-26.93,0-48.84-21.91-48.84-48.84s21.91-48.84,48.84-48.84,48.84,21.91,48.84,48.84-21.91,48.84-48.84,48.84Z" />
                    <circle class="cls-2" cx="381.85" cy="81.41" r="16.2" />
                    <path class="cls-2" d="M381.85,105.73c-12.68,0-23.9,6.25-30.76,15.83,7.14,9.15,18.26,15.04,30.76,15.04s23.62-5.89,30.76-15.04c-6.86-9.58-18.08-15.83-30.76-15.83Z" />
                  </g>
                </svg>
                <h2>Become a Member</h2>
                <p>Create an account for all Lancherix products.</p>
                <p>
                Already have an account?{" "}
                <button
                  type="button"
                  className="link-registerPage"
                  onClick={() => navigate("/login")}
                >
                  Sign In
                </button>
              </p>
              </div>
            </>
          )}

          {/* STEP 2 — LOCATION */}
          {step === 2 && (
            <>
              <h2>Region & Language</h2>
              <p>Choose your region and preferred language.</p>
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  className="link-registerPage"
                  onClick={() => navigate("/login")}
                >
                  Sign In
                </button>
              </p>

              <div className="content-registerPage">
                <div className='input-registerPage'>
                  <select className='inputD-registerPage' value={country} onChange={e => setCountry(e.target.value)}>
                    <option value="CO">Colombia</option>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="UK">United Kingdom</option>
                  </select>
                </div>

                <div className='input-registerPage'>
                  <select className='inputD-registerPage' value={language} onChange={e => setLanguage(e.target.value)}>
                    <option value="en-US">English</option>
                    <option value="es-CO">Español</option>
                    <option value="fr-FR">Français</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* STEP 3 — APPEARANCE */}
          {step === 3 && (
            <>
              <h2>{translations[language].appearance.title}</h2>
              <p>{translations[language].appearance.description}</p>
              <p>
                {translations[language].alreadyHaveAccount}{" "}
                <button
                  type="button"
                  className="link-registerPage"
                  onClick={() => navigate("/login")}
                >
                  {translations[language].signIn}
                </button>
              </p>

              <div className="content-registerPage themes-registerPage">
                {["light", "dark", "glass"].map(mode => (
                  <button
                    key={mode}
                    type="button"
                    className={`theme-card ${themeMode === mode ? "selected" : ""}`}
                    onClick={() => setThemeMode(mode)}
                  >
                    <div className={`theme-preview ${mode}-preview`} />
                    <span className="theme-title">{translations[language].theme[mode]}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* STEP 4 — PERSONAL */}
          {step === 4 && (
            <>
              <h2>{translations[language].personal.title}</h2>
              <p>{translations[language].personal.description}</p>
              <p>
                {translations[language].alreadyHaveAccount}{" "}
                <button
                  type="button"
                  className="link-registerPage"
                  onClick={() => navigate("/login")}
                >
                  {translations[language].signIn}
                </button>
              </p>

              <div className="content-registerPage">
                <div className="fullDate-registerPage">
                  <div className="input-registerPage">
                    <input
                      placeholder={translations[language].personal.firstNamePlaceholder}
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                    />
                  </div>

                  <div className="input-registerPage">
                    <input
                      placeholder={translations[language].personal.lastNamePlaceholder}
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                    />
                  </div>
                </div>

                <p className="birthdayText-registerPage">{translations[language].personal.birthdayLabel}</p>

                <div className="fullDate-registerPage">
                  <div className="inputDate-registerPage">
                    <select className="inputD-registerPage" value={birthMonth} onChange={e => setBirthMonth(e.target.value)}>
                      <option value="">{translations[language].personal.month}</option>
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {new Date(0, i).toLocaleString(language, { month: "long" })}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="inputDate-registerPage">
                    <select className="inputD-registerPage" value={birthDate} onChange={e => setBirthDate(e.target.value)}>
                      <option value="">{translations[language].personal.day}</option>
                      {Array.from({ length: 31 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                      ))}
                    </select>
                  </div>

                  <div className="inputDate-registerPage">
                    <select className="inputD-registerPage" value={birthYear} onChange={e => setBirthYear(e.target.value)}>
                      <option value="">{translations[language].personal.year}</option>
                      {Array.from({ length: 100 }, (_, i) => 1924 + i).reverse().map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="input-registerPage">
                  <select className="inputD-registerPage" value={gender} onChange={e => setGender(e.target.value)}>
                    <option value="">{translations[language].personal.gender}</option>
                    <option value="male">{translations[language].personal.male}</option>
                    <option value="female">{translations[language].personal.female}</option>
                    <option value="preferNotToSay">{translations[language].personal.preferNotToSay}</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* STEP 5 — ACCOUNT */}
          {step === 5 && (
            <>
              <h2>{translations[language].account.title}</h2>
              <p>{translations[language].account.description}</p>
              <p>
                {translations[language].alreadyHaveAccount}{" "}
                <button
                  type="button"
                  className="link-registerPage"
                  onClick={() => navigate("/login")}
                >
                  {translations[language].signIn}
                </button>
              </p>

              <div className="content-registerPage">
                <div className="input-registerPage">
                  <input
                    type="text"
                    placeholder={translations[language].account.usernamePlaceholder}
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                  />
                </div>

                <div className="input-registerPage">
                  <input
                    type="email"
                    placeholder={translations[language].account.emailPlaceholder}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {/* STEP 6 — SECURITY */}
          {step === 6 && (
            <>
              <h2>{translations[language].security.title}</h2>
              <p>{translations[language].security.description}</p>
              <p>
                {translations[language].alreadyHaveAccount}{" "}
                <button
                  type="button"
                  className="link-registerPage"
                  onClick={() => navigate("/login")}
                >
                  {translations[language].signIn}
                </button>
              </p>

              <div className="content-registerPage">
                <div className="input-registerPage">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={translations[language].security.passwordPlaceholder}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="inputPassword-registerPage"
                    spellCheck="false"
                  />
                  {renderPasswordToggle()}
                </div>

                <div className="input-registerPage">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder={translations[language].security.confirmPasswordPlaceholder}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="inputPassword-registerPage"
                    spellCheck="false"
                  />
                  {renderConfirmPasswordToggle()}
                </div>
              </div>
            </>
          )}

          {/* STEP 7 — AGREEMENTS */}
          {step === 7 && (
            <>
              <h2>{translations[language].agreements.title}</h2>
              <p>{translations[language].agreements.description}</p>
              <p>
                {translations[language].alreadyHaveAccount}{" "}
                <button
                  type="button"
                  className="link-registerPage"
                  onClick={() => navigate("/login")}
                >
                  {translations[language].signIn}
                </button>
              </p>

              <div className="content-registerPage agreements-registerPage">
                <label>
                  <input type="checkbox" checked={privacyPolicy} onChange={e => setPrivacyPolicy(e.target.checked)} />
                  {translations[language].agreements.privacy}
                </label>

                <label>
                  <input type="checkbox" checked={cookies} onChange={e => setCookies(e.target.checked)} />
                  {translations[language].agreements.cookies}
                </label>

                <label>
                  <input type="checkbox" checked={notifications} onChange={e => setNotifications(e.target.checked)} />
                  {translations[language].agreements.notifications}
                </label>
              </div>
            </>
          )}

          {error && (
            <div className="error-registerPage">
              {translations[language].errors[error]}
            </div>
          )}

          {/* NAVIGATION */}
          <div className="register-navigation">
            {step > 2 && (
              <button
                className="register-navigationsecondary-btn"
                type="button"
                onClick={prevStep}
              >
                {language === "es-CO" ? "Atrás" : language === "fr-FR" ? "Retour" : "Back"}
              </button>
            )}

            {step === 1 && (
              <button
                className="register-navigationprimary-btn"
                type="button"
                onClick={nextStep}
              >
                {language === "es-CO" ? "Comenzar" : language === "fr-FR" ? "Commencer" : "Start"}
              </button>
            )}

            {step < 7 && step !== 1 && (
              <button
                className="register-navigationprimary-btn"
                type="button"
                onClick={nextStep}
              >
                {language === "es-CO" ? "Siguiente" : language === "fr-FR" ? "Suivant" : "Next"}
              </button>
            )}

            {step === 7 && (
              <button className="register-navigationprimary-btn" type="submit">
                {language === "es-CO" ? "Crear" : language === "fr-FR" ? "Créer" : "Create"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;