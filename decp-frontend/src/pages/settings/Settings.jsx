import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { changePassword as changePasswordRequest } from "../../api/authApi";
import { useAuth } from "../../auth/useAuth";
import "./Settings.css";

const PASSWORD_CHANGED_MESSAGE = "Password changed successfully. Please log in again.";

const getPasswordErrorMessage = (error) => {
  const status = error.response?.status;
  const backendMessage = error.response?.data?.message;

  if (status === 401 || backendMessage === "Current password is incorrect") {
    return "The current password you entered is incorrect.";
  }

  if (status === 400) {
    return backendMessage ?? "Please check the password details and try again.";
  }

  return backendMessage ?? "Unable to change password. Please try again.";
};

const getPasswordChecks = (password = "") => [
  { label: "At least 8 characters", met: password.length >= 8 },
  { label: "Upper and lowercase letters", met: /[a-z]/.test(password) && /[A-Z]/.test(password) },
  { label: "At least one number", met: /\d/.test(password) },
  { label: "At least one symbol", met: /[^A-Za-z0-9]/.test(password) },
];

const getStrengthLabel = (score) => {
  if (score >= 4) {
    return "Strong";
  }

  if (score >= 3) {
    return "Good";
  }

  if (score >= 2) {
    return "Fair";
  }

  return "Needs work";
};

const PasswordField = ({ autoComplete, error, id, label, onToggle, registration, visible }) => {
  const Icon = visible ? EyeOff : Eye;

  return (
    <label className="settings-field" htmlFor={id}>
      <span>{label}</span>
      <span className="settings-password-input">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          aria-invalid={error ? "true" : "false"}
          {...registration}
        />
        <button
          className="settings-icon-button"
          type="button"
          onClick={onToggle}
          title={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        >
          <Icon size={17} aria-hidden="true" />
        </button>
      </span>
      {error && <span className="field-error">{error.message}</span>}
    </label>
  );
};

const Settings = () => {
  const { clearSession, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const currentSection = location.pathname.includes("/account") ? "account" : "security";
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [visiblePasswords, setVisiblePasswords] = useState({
    confirmNewPassword: false,
    currentPassword: false,
    newPassword: false,
  });

  const {
    register,
    handleSubmit,
    getValues,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const newPassword = useWatch({ control, name: "newPassword" }) ?? "";
  const passwordChecks = useMemo(() => getPasswordChecks(newPassword), [newPassword]);
  const strengthScore = passwordChecks.filter((check) => check.met).length;
  const strengthLabel = getStrengthLabel(strengthScore);

  const togglePasswordVisibility = (field) => {
    setVisiblePasswords((currentVisibility) => ({
      ...currentVisibility,
      [field]: !currentVisibility[field],
    }));
  };

  const onSubmit = async ({ currentPassword, newPassword: submittedNewPassword }) => {
    setServerError("");
    setSuccessMessage("");

    try {
      await changePasswordRequest({
        currentPassword,
        newPassword: submittedNewPassword,
      });

      setSuccessMessage(PASSWORD_CHANGED_MESSAGE);
      await new Promise((resolve) => {
        window.setTimeout(resolve, 900);
      });
      clearSession();
      navigate("/login", {
        replace: true,
        state: {
          message: PASSWORD_CHANGED_MESSAGE,
          passwordChanged: true,
        },
      });
    } catch (error) {
      setServerError(getPasswordErrorMessage(error));
    }
  };

  return (
    <section className="settings-page">
      <aside className="settings-nav" aria-label="Settings sections">
        <div>
          <p>Settings</p>
          <h2>Account Control</h2>
        </div>
        <nav>
          <NavLink to="/settings/account">
            <UserRound size={18} aria-hidden="true" />
            <span>Account</span>
          </NavLink>
          <NavLink to="/settings/security">
            <ShieldCheck size={18} aria-hidden="true" />
            <span>Security</span>
          </NavLink>
        </nav>
      </aside>

      <div className="settings-content">
        {currentSection === "account" ? (
          <section className="settings-card" aria-labelledby="settings-account-heading">
            <div className="settings-card__header">
              <div>
                <p className="settings-eyebrow">Account</p>
                <h2 id="settings-account-heading">Account Details</h2>
                <p>Review your signed-in identity and jump to profile details when updates are needed.</p>
              </div>
            </div>

            <dl className="settings-details">
              <div>
                <dt>Email</dt>
                <dd>{user?.email || "Not provided"}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{user?.role || "Not provided"}</dd>
              </div>
            </dl>

            <div className="settings-callout">
              <UserRound size={20} aria-hidden="true" />
              <div>
                <h3>Profile information lives in Profile</h3>
                <p>Academic details, skills, links, and bio are managed from your profile page.</p>
              </div>
              <Link to="/profile/edit">
                Edit profile
                <ExternalLink size={15} aria-hidden="true" />
              </Link>
            </div>
          </section>
        ) : (
          <section className="settings-card" aria-labelledby="settings-security-heading">
            <div className="settings-card__header">
              <div>
                <p className="settings-eyebrow">Security</p>
                <h2 id="settings-security-heading">Change Password</h2>
                <p>Update your password from account security. You will need to log in again after this change.</p>
              </div>
              <span className="settings-security-badge">
                <LockKeyhole size={16} aria-hidden="true" />
                Protected
              </span>
            </div>

            <form className="settings-form" onSubmit={handleSubmit(onSubmit)}>
              {successMessage && <div className="form-success">{successMessage}</div>}
              {serverError && <div className="form-error">{serverError}</div>}

              <PasswordField
                id="currentPassword"
                label="Current password"
                autoComplete="current-password"
                visible={visiblePasswords.currentPassword}
                onToggle={() => togglePasswordVisibility("currentPassword")}
                error={errors.currentPassword}
                registration={register("currentPassword", {
                  required: "Current password is required",
                })}
              />

              <PasswordField
                id="newPassword"
                label="New password"
                autoComplete="new-password"
                visible={visiblePasswords.newPassword}
                onToggle={() => togglePasswordVisibility("newPassword")}
                error={errors.newPassword}
                registration={register("newPassword", {
                  required: "New password is required",
                  minLength: {
                    value: 8,
                    message: "New password must be at least 8 characters",
                  },
                })}
              />

              <div className="settings-password-strength" aria-live="polite">
                <div>
                  <span>Password strength</span>
                  <strong>{strengthLabel}</strong>
                </div>
                <div className="settings-strength-meter" data-score={strengthScore}>
                  <span />
                </div>
                <ul>
                  {passwordChecks.map((check) => (
                    <li className={check.met ? "is-met" : ""} key={check.label}>
                      {check.label}
                    </li>
                  ))}
                </ul>
              </div>

              <PasswordField
                id="confirmNewPassword"
                label="Confirm new password"
                autoComplete="new-password"
                visible={visiblePasswords.confirmNewPassword}
                onToggle={() => togglePasswordVisibility("confirmNewPassword")}
                error={errors.confirmNewPassword}
                registration={register("confirmNewPassword", {
                  required: "Please confirm your new password",
                  validate: (value) => value === getValues("newPassword") || "New passwords must match",
                })}
              />

              <div className="settings-form__actions">
                <button className="settings-submit" type="submit" disabled={isSubmitting}>
                  <KeyRound size={17} aria-hidden="true" />
                  {isSubmitting ? "Changing..." : "Change password"}
                </button>
              </div>
            </form>
          </section>
        )}
      </div>
    </section>
  );
};

export default Settings;
