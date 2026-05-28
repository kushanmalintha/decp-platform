import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { changePassword as changePasswordRequest } from "../../api/authApi";
import { useAuth } from "../../auth/useAuth";
import "./Auth.css";

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

const ChangePassword = () => {
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { clearSession } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

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
    <section className="auth-settings-page">
      <div className="auth-settings-page__header">
        <h1>Change Password</h1>
        <p>Update your password. You will need to log in again after this change.</p>
      </div>

      <form className="auth-settings-form" onSubmit={handleSubmit(onSubmit)}>
        {successMessage && <div className="form-success">{successMessage}</div>}
        {serverError && <div className="form-error">{serverError}</div>}

        <label>
          Current password
          <input
            type="password"
            autoComplete="current-password"
            {...register("currentPassword", {
              required: "Current password is required",
            })}
          />
          {errors.currentPassword && (
            <span className="field-error">{errors.currentPassword.message}</span>
          )}
        </label>

        <label>
          New password
          <input
            type="password"
            autoComplete="new-password"
            {...register("newPassword", {
              required: "New password is required",
              minLength: {
                value: 8,
                message: "New password must be at least 8 characters",
              },
            })}
          />
          {errors.newPassword && <span className="field-error">{errors.newPassword.message}</span>}
        </label>

        <label>
          Confirm new password
          <input
            type="password"
            autoComplete="new-password"
            {...register("confirmNewPassword", {
              required: "Please confirm your new password",
              validate: (value) => value === getValues("newPassword") || "New passwords must match",
            })}
          />
          {errors.confirmNewPassword && (
            <span className="field-error">{errors.confirmNewPassword.message}</span>
          )}
        </label>

        <div className="auth-settings-form__actions">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Changing..." : "Change Password"}
          </button>
        </div>
      </form>
    </section>
  );
};

export default ChangePassword;
