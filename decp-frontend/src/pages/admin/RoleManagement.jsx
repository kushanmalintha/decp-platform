import { useState } from "react";
import { useForm } from "react-hook-form";

import { assignUserRole } from "../../api/authApi";
import "./Admin.css";

const ASSIGNABLE_ROLES = ["STUDENT", "ALUMNI"];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getResponsePayload = (response) => {
  const body = response.data ?? {};
  const data = typeof body.data === "object" && body.data !== null ? body.data : {};

  return {
    ...body,
    ...data,
    message: data.message ?? body.message,
  };
};

const getBackendMessage = (error) => {
  const message = error.response?.data?.message;

  if (typeof message !== "string") {
    return "";
  }

  return message.includes("\n") ? "" : message;
};

const getRoleAssignmentErrorMessage = (error) => {
  const status = error.response?.status;
  const backendMessage = getBackendMessage(error);

  if (status === 400) {
    if (backendMessage.toLowerCase().includes("role")) {
      return backendMessage || "That role is not supported for assignment.";
    }

    return backendMessage || "Please check the email and selected role, then try again.";
  }

  if (status === 401) {
    return "Your session has expired or is invalid. Please log in again.";
  }

  if (status === 403) {
    return "Only admin users can assign roles.";
  }

  return backendMessage || "Unable to update the role right now. Please try again.";
};

const RoleManagement = () => {
  const [serverError, setServerError] = useState("");
  const [successDetails, setSuccessDetails] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: "",
      role: "STUDENT",
    },
  });

  const onSubmit = async (formData) => {
    setServerError("");
    setSuccessDetails(null);

    try {
      const response = await assignUserRole(formData);
      const payload = getResponsePayload(response);

      setSuccessDetails({
        email: payload.email ?? formData.email,
        role: payload.role ?? formData.role,
        message: payload.message ?? "Role updated successfully.",
      });
      reset({ email: "", role: "STUDENT" });
    } catch (error) {
      setServerError(getRoleAssignmentErrorMessage(error));
    }
  };

  return (
    <section className="admin-page">
      <div className="admin-page__header">
        <h1>Admin Role Management</h1>
        <p>Assign supported roles to registered users by email.</p>
      </div>

      <div className="admin-note">
        After role update, the target user must log in again to receive the new role.
      </div>

      <form className="admin-role-form" onSubmit={handleSubmit(onSubmit)}>
        {successDetails && (
          <div className="form-success">
            <strong>{successDetails.message}</strong>
            <span>Email: {successDetails.email}</span>
            <span>Role: {successDetails.role}</span>
          </div>
        )}
        {serverError && <div className="form-error">{serverError}</div>}

        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            placeholder="user@example.com"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: EMAIL_PATTERN,
                message: "Enter a valid email address",
              },
            })}
          />
          {errors.email && <span className="field-error">{errors.email.message}</span>}
        </label>

        <label>
          Role
          <select
            {...register("role", {
              required: "Role is required",
              validate: (value) =>
                ASSIGNABLE_ROLES.includes(value) || "Select a supported role",
            })}
          >
            {ASSIGNABLE_ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          {errors.role && <span className="field-error">{errors.role.message}</span>}
        </label>

        <div className="admin-role-form__actions">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update Role"}
          </button>
        </div>
      </form>
    </section>
  );
};

export default RoleManagement;
