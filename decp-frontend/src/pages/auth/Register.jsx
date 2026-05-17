import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

import { register as registerRequest } from "../../api/authApi";
import "./AuthPages.css";

const Register = () => {
  const [serverError, setServerError] = useState("");
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data) => {
    setServerError("");

    try {
      await registerRequest({
        name: data.name.trim() || undefined,
        email: data.email.trim(),
        password: data.password,
      });
      navigate("/login", { replace: true });
    } catch (error) {
      setServerError(error.response?.data?.message ?? "Unable to register.");
    }
  };

  return (
    <main className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <h1>Register</h1>
          <p>Create your DECP Platform account.</p>
        </div>

        {serverError && <div className="form-error">{serverError}</div>}

        <label>
          Name
          <input
            type="text"
            autoComplete="name"
            {...register("name", { required: "Name is required" })}
          />
          {errors.name && <span className="field-error">{errors.name.message}</span>}
        </label>

        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            {...register("email", { required: "Email is required" })}
          />
          {errors.email && <span className="field-error">{errors.email.message}</span>}
        </label>

        <label>
          Password
          <input
            type="password"
            autoComplete="new-password"
            {...register("password", { required: "Password is required" })}
          />
          {errors.password && <span className="field-error">{errors.password.message}</span>}
        </label>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Register"}
        </button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </main>
  );
};

export default Register;
