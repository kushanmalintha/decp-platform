import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../auth/useAuth";
import "./AuthPages.css";

const Login = () => {
  const [serverError, setServerError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname ?? "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data) => {
    setServerError("");

    try {
      await login(data);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setServerError(error.response?.data?.message ?? error.message ?? "Unable to login.");
    }
  };

  return (
    <main className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <h1>Login</h1>
          <p>Sign in to continue to the DECP Platform.</p>
        </div>

        {serverError && <div className="form-error">{serverError}</div>}

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
            autoComplete="current-password"
            {...register("password", { required: "Password is required" })}
          />
          {errors.password && <span className="field-error">{errors.password.message}</span>}
        </label>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Login"}
        </button>

        <p className="auth-switch">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </main>
  );
};

export default Login;
